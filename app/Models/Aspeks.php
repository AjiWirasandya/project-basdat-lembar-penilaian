<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Aspeks extends Model
{
    protected $table = 'aspeks';
    protected $fillable = [
        'chapter_id', 'nama_aspek'
    ];

    public function chapter() {
        return $this->belongsTo(Chapters::class, 'chapter_id');
    }

    // Rename to match the relationship name being called
    public function subAspeks() {
        return $this->hasMany(sub_aspeks::class, 'aspek_id');
    }
}