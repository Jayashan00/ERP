<?php

namespace Workdo\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosShiftCashMovement extends Model
{
    protected $fillable = [
        'pos_shift_id',
        'type',
        'amount',
        'reason',
        'creator_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(PosShift::class, 'pos_shift_id');
    }
}
