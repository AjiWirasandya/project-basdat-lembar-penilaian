<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PenilaianController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    Route::get('create-sheet', [\App\Http\Controllers\CreateSheetController::class, 'index'])->name('create-sheet');
    Route::post('penilaian', [PenilaianController::class, 'store'])->name('penilaian.store');
    Route::put('penilaian/{penilaian}', [PenilaianController::class, 'update'])->name('penilaian.update');
    Route::delete('penilaian/{penilaian}', [PenilaianController::class, 'destroy'])->name('penilaian.destroy');
    Route::get('penilaian/{penilaian}/edit', [PenilaianController::class, 'edit'])->name('penilaian.edit');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
