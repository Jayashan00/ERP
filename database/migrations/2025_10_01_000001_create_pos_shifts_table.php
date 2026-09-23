<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('pos_shifts')) {
            Schema::create('pos_shifts', function (Blueprint $table) {
                $table->id();
                $table->string('shift_number');
                $table->foreignId('warehouse_id')->nullable()->index();
                $table->foreignId('cashier_id')->index(); // user who ran the shift
                $table->foreignId('opened_by')->nullable()->index(); // manager who approved opening, if different
                $table->foreignId('closed_by')->nullable()->index(); // manager who approved closing
                $table->dateTime('opened_at');
                $table->dateTime('closed_at')->nullable();
                $table->decimal('opening_cash', 15, 2)->default(0);
                $table->decimal('expected_cash', 15, 2)->default(0);
                $table->decimal('closing_cash', 15, 2)->nullable();
                $table->decimal('cash_difference', 15, 2)->nullable();
                $table->decimal('total_sales', 15, 2)->default(0);
                $table->decimal('total_cash_sales', 15, 2)->default(0);
                $table->decimal('total_card_sales', 15, 2)->default(0);
                $table->decimal('total_other_sales', 15, 2)->default(0);
                $table->decimal('total_refunds', 15, 2)->default(0);
                $table->unsignedInteger('total_orders')->default(0);
                $table->enum('status', ['open', 'closed'])->default('open');
                $table->text('opening_notes')->nullable();
                $table->text('closing_notes')->nullable();
                $table->foreignId('creator_id')->nullable()->index();
                $table->foreignId('created_by')->nullable()->index();
                $table->timestamps();

                $table->foreign('warehouse_id')->references('id')->on('warehouses')->onDelete('set null');
                $table->foreign('cashier_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('opened_by')->references('id')->on('users')->onDelete('set null');
                $table->foreign('closed_by')->references('id')->on('users')->onDelete('set null');
                $table->foreign('creator_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_shifts');
    }
};
