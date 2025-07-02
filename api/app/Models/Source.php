<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Source extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'api_id',
        'url',
    ];

    /**
     * Get the articles associated with the source.
     */
    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }
}

