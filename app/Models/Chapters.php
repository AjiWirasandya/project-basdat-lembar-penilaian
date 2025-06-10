<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chapters extends Model
{
    protected $table = 'chapters';
    protected $fillable = [
        'penilaian_id', 'nama_chapter', 'bobot'
    ];

    public function penilaian() {
        return $this->belongsTo(Penilaian::class, 'penilaian_id');
    }

    public function aspeks() {
        return $this->hasMany(Aspeks::class, 'chapter_id');
    }
}