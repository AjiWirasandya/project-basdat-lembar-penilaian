<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Penilaian;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Ambil semua penilaian beserta relasi
        $penilaians = Penilaian::with(['chapters.aspeks.subAspeks'])->latest()->get();
        // Hitung summary
        $summary = [
            'totalPenilaian' => $penilaians->count(),
            'rataRataNilai' => $penilaians->avg('nilai_final'),
            'statusLanjut' => $penilaians->where('status', 'LANJUT')->count(),
            'statusUlang' => $penilaians->where('status', 'ULANG')->count(),
        ];
        return Inertia::render('dashboard', [
            'penilaians' => $penilaians,
            'summary' => $summary,
        ]);
    }
}
