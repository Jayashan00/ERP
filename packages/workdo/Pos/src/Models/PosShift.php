<?php

namespace Workdo\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;
use App\Models\Warehouse;

class PosShift extends Model
{
    protected $fillable = [
        'shift_number',
        'warehouse_id',
        'cashier_id',
        'opened_by',
        'closed_by',
        'opened_at',
        'closed_at',
        'opening_cash',
        'expected_cash',
        'closing_cash',
        'cash_difference',
        'total_sales',
        'total_cash_sales',
        'total_card_sales',
        'total_other_sales',
        'total_refunds',
        'total_orders',
        'status',
        'opening_notes',
        'closing_notes',
        'creator_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'opening_cash' => 'decimal:2',
            'expected_cash' => 'decimal:2',
            'closing_cash' => 'decimal:2',
            'cash_difference' => 'decimal:2',
            'total_sales' => 'decimal:2',
            'total_cash_sales' => 'decimal:2',
            'total_card_sales' => 'decimal:2',
            'total_other_sales' => 'decimal:2',
            'total_refunds' => 'decimal:2',
        ];
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Pos::class, 'pos_shift_id');
    }

    public function cashMovements(): HasMany
    {
        return $this->hasMany(PosShiftCashMovement::class, 'pos_shift_id');
    }

    public static function generateShiftNumber(): string
    {
        $nextNumber = self::where('created_by', creatorId())->count() + 1;
        return '#SHIFT' . str_pad((string) $nextNumber, 5, '0', STR_PAD_LEFT);
    }

    public static function findOpenFor(int $cashierId)
    {
        return self::where('cashier_id', $cashierId)
            ->where('status', 'open')
            ->where('created_by', creatorId())
            ->latest('opened_at')
            ->first();
    }

    public function recalculateTotals(): void
    {
        $sales = $this->sales()->with('payment')->get();

        $totalSales = 0;
        $cashSales = 0;
        $cardSales = 0;
        $otherSales = 0;

        foreach ($sales as $sale) {
            if (!$sale->payment) {
                continue;
            }
            $amount = (float) $sale->payment->discount_amount;
            $totalSales += $amount;

            switch ($sale->payment->payment_method ?? 'cash') {
                case 'cash':
                    $cashSales += $amount;
                    break;
                case 'card':
                    $cardSales += $amount;
                    break;
                case 'split':
                    $cashSales += (float) ($sale->payment->cash_paid ?? 0);
                    $cardSales += (float) ($sale->payment->card_paid ?? 0);
                    break;
                default:
                    $otherSales += $amount;
            }
        }

        $cashIn = $this->cashMovements()->where('type', 'cash_in')->sum('amount');
        $cashOut = $this->cashMovements()->where('type', 'cash_out')->sum('amount');

        $this->total_sales = $totalSales;
        $this->total_cash_sales = $cashSales;
        $this->total_card_sales = $cardSales;
        $this->total_other_sales = $otherSales;
        $this->total_orders = $sales->count();
        $this->expected_cash = $this->opening_cash + $cashSales + $cashIn - $cashOut;
        $this->save();
    }
}
