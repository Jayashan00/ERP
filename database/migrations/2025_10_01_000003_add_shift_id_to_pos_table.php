<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pos') && !Schema::hasColumn('pos', 'pos_shift_id')) {
            Schema::table('pos', function (Blueprint $table) {
                $table->foreignId('pos_shift_id')->nullable()->after('warehouse_id')->index();
                $table->foreign('pos_shift_id')->references('id')->on('pos_shifts')->onDelete('set null');
            });
        }

        if (Schema::hasTable('pos_payments') && !Schema::hasColumn('pos_payments', 'payment_method')) {
            Schema::table('pos_payments', function (Blueprint $table) {
                $table->enum('payment_method', ['cash', 'card', 'split', 'other'])->default('cash')->after('pos_id');
                $table->decimal('cash_paid', 15, 2)->nullable()->after('payment_method');
                $table->decimal('card_paid', 15, 2)->nullable()->after('cash_paid');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pos') && Schema::hasColumn('pos', 'pos_shift_id')) {
            Schema::table('pos', function (Blueprint $table) {
                $table->dropForeign(['pos_shift_id']);
                $table->dropColumn('pos_shift_id');
            });
        }

        if (Schema::hasTable('pos_payments') && Schema::hasColumn('pos_payments', 'payment_method')) {
            Schema::table('pos_payments', function (Blueprint $table) {
                $table->dropColumn(['payment_method', 'cash_paid', 'card_paid']);
            });
        }
    }
};
