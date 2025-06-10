<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Penilaian;
use App\Models\Chapters;
use App\Models\Aspeks;
use App\Models\Sub_Aspeks;
use Illuminate\Support\Facades\DB;

class PenilaianController extends Controller
{
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            // Validasi request terlebih dahulu
            $validated = $request->validate([
                'project_name' => 'required|string',
                'penguji' => 'required|string',
                'catatan' => 'nullable|string',
                'nilai_final' => 'required|numeric',
                'predikat' => 'required|string',
                'status' => 'required|string',
            ]);

            // Simpan penilaian utama
            $penilaian = Penilaian::create([
                'project_name' => $validated['project_name'],
                'penguji' => $validated['penguji'],
                'catatan' => $validated['catatan'],
                'nilai_final' => $validated['nilai_final'],
                'predikat' => $validated['predikat'],
                'status' => $validated['status'],
            ]);

            // Simpan chapters
            foreach ($request->chapters as $chapterData) {
                $chapter = Chapters::create([
                    'penilaian_id' => $penilaian->id,
                    'nama_chapter' => $chapterData['nama_chapter'],
                    'bobot' => $chapterData['bobot'],
                ]);
                // Simpan aspeks
                foreach ($chapterData['aspek'] as $aspekData) {
                    $aspek = Aspeks::create([
                        'chapter_id' => $chapter->id,
                        'nama_aspek' => $aspekData['nama_aspek'],
                    ]);
                    // Simpan sub_aspeks
                    foreach ($aspekData['sub_aspek'] as $subAspekData) {
                        Sub_Aspeks::create([
                            'aspek_id' => $aspek->id,
                            'nama_sub_aspek' => $subAspekData['nama_sub_aspek'],
                            'kesalahan' => $subAspekData['kesalahan'],
                        ]);
                    }
                }
            }
            DB::commit();
            // Redirect ke halaman dashboard setelah berhasil
            return redirect()->route('dashboard');
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal menyimpan penilaian', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Penilaian $penilaian)
    {
        $penilaian->delete(); // relasi akan ikut terhapus karena cascade
        return redirect()->route('dashboard');
    }

    public function edit(Penilaian $penilaian)
    {
        $penilaian->load(['chapters.aspeks.subAspeks']);
        return inertia('EditSheet', [
            'penilaian' => $penilaian
        ]);
    }

    public function update(Request $request, Penilaian $penilaian)
    {
        DB::beginTransaction();
        try {
            $validated = $request->validate([
                'project_name' => 'required|string',
                'penguji' => 'required|string',
                'catatan' => 'nullable|string',
                'nilai_final' => 'required|numeric',
                'predikat' => 'required|string',
                'status' => 'required|string',
            ]);

            // Update penilaian utama
            $penilaian->update($validated);

            // Hapus semua relasi lama (cascade)
            foreach ($penilaian->chapters as $chapter) {
                foreach ($chapter->aspeks as $aspek) {
                    $aspek->subAspeks()->delete();
                }
                $chapter->aspeks()->delete();
            }
            $penilaian->chapters()->delete();

            // Simpan ulang data relasi baru
            foreach ($request->chapters as $chapterData) {
                $chapter = Chapters::create([
                    'penilaian_id' => $penilaian->id,
                    'nama_chapter' => $chapterData['nama_chapter'],
                    'bobot' => $chapterData['bobot'],
                ]);
                foreach ($chapterData['aspek'] as $aspekData) {
                    $aspek = Aspeks::create([
                        'chapter_id' => $chapter->id,
                        'nama_aspek' => $aspekData['nama_aspek'],
                    ]);
                    foreach ($aspekData['sub_aspek'] as $subAspekData) {
                        Sub_Aspeks::create([
                            'aspek_id' => $aspek->id,
                            'nama_sub_aspek' => $subAspekData['nama_sub_aspek'],
                            'kesalahan' => $subAspekData['kesalahan'],
                        ]);
                    }
                }
            }
            DB::commit();
            return redirect()->route('dashboard');
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal update penilaian', 'error' => $e->getMessage()], 500);
        }
    }
}
