<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('pos_shift_cash_movements')) {
            Schema::create('pos_shift_cash_movements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pos_shift_id')->index();
                $table->enum('type', ['cash_in', 'cash_out'])->default('cash_in');
                $table->decimal('amount', 15, 2);
                $table->string('reason')->nullable();
                $table->foreignId('creator_id')->nullable()->index();
                $table->foreignId('created_by')->nullable()->index();
                $table->timestamps();

                $table->foreign('pos_shift_id')->references('id')->on('pos_shifts')->onDelete('cascade');
                $table->foreign('creator_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_shift_cash_movements');
    }
};
