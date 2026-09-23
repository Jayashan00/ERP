<?php

use Illuminate\Support\Facades\Route;
use Workdo\Pos\Http\Controllers\DashboardController;
use Workdo\Pos\Http\Controllers\PosController;
use Workdo\Pos\Http\Controllers\PosReportController;
use Workdo\Pos\Http\Controllers\PosShiftController;

Route::middleware(['web', 'auth', 'verified', 'PlanModuleCheck:Pos'])->group(function () {
    Route::get('/dashboard/pos', [DashboardController::class, 'index'])->name('pos.index');

    // POS Routes
    Route::get('/pos/orders', [PosController::class, 'index'])->name('pos.orders');
    Route::get('/pos/create', [PosController::class, 'create'])->name('pos.create');
    Route::get('/pos/products', [PosController::class, 'getProducts'])->name('pos.products');
    Route::get('/pos/pos-number', [PosController::class, 'getNextPosNumber'])->name('pos.pos-number');
    Route::post('/pos/store', [PosController::class, 'store'])->name('pos.store');
    Route::get('/pos/orders/{sale}', [PosController::class, 'show'])->name('pos.show');
    Route::get('/pos/barcode', [PosController::class, 'barcode'])->name('pos.barcode');
    Route::get('/pos/barcode/{sale}', [PosController::class, 'printBarcode'])->name('pos.barcode.print');
    Route::get('/pos/orders/{sale}/print', [PosController::class, 'print'])->name('pos-orders.print');

    // POS Shift & Cash Drawer Routes
    Route::prefix('pos/shifts')->name('pos.shifts.')->group(function () {
        Route::get('/', [PosShiftController::class, 'index'])->name('index');
        Route::get('/current', [PosShiftController::class, 'current'])->name('current');
        Route::post('/open', [PosShiftController::class, 'open'])->name('open');
        Route::post('/{shift}/cash-movement', [PosShiftController::class, 'addCashMovement'])->name('cash-movement');
        Route::post('/{shift}/close', [PosShiftController::class, 'close'])->name('close');
        Route::get('/{shift}/z-report', [PosShiftController::class, 'zReport'])->name('z-report');
    });

    // POS Reports

    Route::prefix('pos/reports')->name('pos.reports.')->group(function () {
        Route::get('/sales', [PosReportController::class, 'sales'])->name('sales');
        Route::get('/products', [PosReportController::class, 'products'])->name('products');
        Route::get('/customers', [PosReportController::class, 'customers'])->name('customers');
    });


});
