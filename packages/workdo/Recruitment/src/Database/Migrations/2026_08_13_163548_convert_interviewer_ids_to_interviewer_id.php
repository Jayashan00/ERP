<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add the new column first.
        Schema::table('interview_feedbacks', function (Blueprint $table) {
            $table->foreignId('interviewer_id')
                ->nullable()
                ->after('interview_id')
                ->index();
        });

        // 2. Convert existing JSON interviewer_ids into separate rows.
        DB::table('interview_feedbacks')
            ->orderBy('id')
            ->chunkById(100, function ($feedbacks) {
                foreach ($feedbacks as $feedback) {
                    if (empty($feedback->interviewer_ids)) {
                        continue;
                    }

                    $interviewerIds = json_decode($feedback->interviewer_ids, true);

                    if (!is_array($interviewerIds)) {
                        continue;
                    }

                    // Remove invalid/duplicate IDs.
                    $interviewerIds = array_values(
                        array_unique(
                            array_filter($interviewerIds, fn($id) => is_numeric($id))
                        )
                    );

                    if (empty($interviewerIds)) {
                        continue;
                    }

                    // Use the first interviewer on the existing row.
                    DB::table('interview_feedbacks')
                        ->where('id', $feedback->id)
                        ->update([
                            'interviewer_id' => $interviewerIds[0],
                        ]);

                    // Create a new feedback row for every additional interviewer.
                    foreach (array_slice($interviewerIds, 1) as $interviewerId) {
                        DB::table('interview_feedbacks')->insert([
                            'technical_rating' => $feedback->technical_rating,
                            'communication_rating' => $feedback->communication_rating,
                            'cultural_fit_rating' => $feedback->cultural_fit_rating,
                            'overall_rating' => $feedback->overall_rating,

                            'strengths' => $feedback->strengths,
                            'weaknesses' => $feedback->weaknesses,
                            'comments' => $feedback->comments,

                            'recommendation' => $feedback->recommendation,

                            'interview_id' => $feedback->interview_id,
                            'interviewer_id' => $interviewerId,

                            'creator_id' => $feedback->creator_id,
                            'created_by' => $feedback->created_by,

                            'created_at' => $feedback->created_at,
                            'updated_at' => $feedback->updated_at,
                        ]);
                    }
                }
            });

        // 3. Remove the old JSON column.
        Schema::table('interview_feedbacks', function (Blueprint $table) {
            $table->dropColumn('interviewer_ids');
        });

        // 4. Add the foreign key after the data has been migrated.
        Schema::table('interview_feedbacks', function (Blueprint $table) {
            $table->foreign('interviewer_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        // Restore the JSON column.
        Schema::table('interview_feedbacks', function (Blueprint $table) {
            $table->json('interviewer_ids')->nullable();
        });

        // Group interviewer IDs back into JSON by interview/feedback context
        // if rollback support is required.
        DB::table('interview_feedbacks')
            ->orderBy('id')
            ->get()
            ->groupBy('interview_id')
            ->each(function ($feedbacks) {
                // Rollback implementation depends on whether feedback rows
                // created for different interviewers should be merged.
            });

        Schema::table('interview_feedbacks', function (Blueprint $table) {
            $table->dropForeign(['interviewer_id']);
            $table->dropColumn('interviewer_id');
        });
    }
};
