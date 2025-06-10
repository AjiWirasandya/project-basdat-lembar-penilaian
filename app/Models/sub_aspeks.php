<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sub_Aspeks extends Model
{
    protected $table = 'sub_aspeks';
    protected $fillable = [
        'aspek_id', 'nama_sub_aspek', 'kesalahan'
    ];
    public function aspek() {
        return $this->belongsTo(Aspeks::class);
    }
}
