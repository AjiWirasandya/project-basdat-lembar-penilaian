<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Penilaian extends Model
{
    protected $table = 'penilaian';
    protected $fillable = [
        'project_name', 'penguji', 'catatan', 'nilai_final', 'predikat', 'status'
    ];

    public function chapters() {
        return $this->hasMany(Chapters::class);
    }
}