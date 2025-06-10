import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import rumus from '../lib/rumus-penilaian.json';

// Tipe data yang lebih spesifik
interface SubAspek {
    name: string;
    kesalahan: number;
}
interface Aspek {
    name: string;
    subAspek: SubAspek[];
}
interface Chapter {
    name: string;
    bobot: number;
    aspek: Aspek[];
}
interface Penilaian {
    id: number;
    project_name: string;
    penguji: string;
    catatan: string;
    chapters: Array<{
        nama_chapter: string;
        bobot: number;
        aspeks: Array<{
            nama_aspek: string;
            sub_aspeks: Array<{
                nama_sub_aspek: string;
                kesalahan: number;
            }>;
        }>;
    }>;
}
interface Predikat {
    min: number;
    max: number;
    label: string;
}

function hitungNilaiFinal(chapters: Chapter[]): { totalKesalahan: number, totalNilai: number, nilaiFinal: number, predikat: string } {
    const nilaiMaks = (rumus as { nilai_maksimum: number; predikat: Predikat[] }).nilai_maksimum;
    const chapterResults = chapters.map((ch: Chapter) => {
        const totalKesalahan = ch.aspek.reduce((a: number, asp: Aspek) => a + asp.subAspek.reduce((b: number, sa: SubAspek) => b + Number(sa.kesalahan || 0), 0), 0);
        const totalNilai = nilaiMaks - totalKesalahan;
        return { bobot: Number(ch.bobot), totalKesalahan, totalNilai };
    });
    const sumBobot = chapterResults.reduce((a: number, c: { bobot: number }) => a + c.bobot, 0);
    const sumBobotNilai = chapterResults.reduce((a: number, c: { bobot: number; totalNilai: number }) => a + (c.bobot * c.totalNilai), 0);
    const nilaiFinal = sumBobot ? Math.round((sumBobotNilai / sumBobot) * 10) / 10 : 0;
    const totalKesalahan = chapterResults.reduce((a: number, c: { totalKesalahan: number }) => a + c.totalKesalahan, 0);
    let predikat = "Cukup";
    for (const p of (rumus as { nilai_maksimum: number; predikat: Predikat[] }).predikat) {
        if (nilaiFinal >= p.min && nilaiFinal <= p.max) {
            predikat = p.label;
            break;
        }
    }
    return { totalKesalahan, totalNilai: Math.round(nilaiFinal), nilaiFinal, predikat };
}

export default function EditSheet({ penilaian }: { penilaian: Penilaian }) {
    const [projectName, setProjectName] = useState(penilaian.project_name || '');
    const [penguji, setPenguji] = useState(penilaian.penguji || '');
    const [catatan, setCatatan] = useState(penilaian.catatan || '');
    const [chapters, setChapters] = useState<Chapter[]>(
        (penilaian.chapters || []).map((ch) => ({
            name: ch.nama_chapter,
            bobot: ch.bobot,
            aspek: (ch.aspeks || []).map((a) => ({
                name: a.nama_aspek,
                subAspek: (a.sub_aspeks || []).map((s) => ({
                    name: s.nama_sub_aspek,
                    kesalahan: s.kesalahan
                }))
            }))
        }))
    );

    // Handler untuk chapter, aspek, sub aspek (sama seperti CreateSheet)
    const addChapter = () => setChapters([...chapters, { name: '', bobot: 100, aspek: [{ name: '', subAspek: [{ name: '', kesalahan: 0 }] }] }]);
    const removeChapter = (idx: number) => setChapters(chapters.filter((_, i) => i !== idx));
    const updateChapter = (idx: number, key: keyof Chapter, value: string | number | Aspek[]) => setChapters(chapters.map((c, i) => i === idx ? { ...c, [key]: value } : c));
    const addAspek = (chapterIdx: number) => setChapters(chapters.map((c, i) => i === chapterIdx ? { ...c, aspek: [...c.aspek, { name: '', subAspek: [{ name: '', kesalahan: 0 }] }] } : c));
    const addSubAspek = (chapterIdx: number, aspekIdx: number) => setChapters(chapters.map((c, i) => i === chapterIdx ? { ...c, aspek: c.aspek.map((a, j) => j === aspekIdx ? { ...a, subAspek: [...a.subAspek, { name: '', kesalahan: 0 }] } : a) } : c));
    const removeSubAspek = (chapterIdx: number, aspekIdx: number, subIdx: number) => setChapters(chapters.map((c, i) => i === chapterIdx ? { ...c, aspek: c.aspek.map((a, j) => j === aspekIdx ? { ...a, subAspek: a.subAspek.filter((_, k) => k !== subIdx) } : a) } : c));
    const updateSubAspek = (chapterIdx: number, aspekIdx: number, subIdx: number, key: keyof SubAspek, value: string | number) => setChapters(chapters.map((c, i) => i === chapterIdx ? { ...c, aspek: c.aspek.map((a, j) => j === aspekIdx ? { ...a, subAspek: a.subAspek.map((s, k) => k === subIdx ? { ...s, [key]: value } : s) } : a) } : c));

    const hasilRealtime = hitungNilaiFinal(chapters);

    const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Validasi (sama seperti create)
        if (!projectName.trim()) {
            alert('Nama project harus diisi');
            return;
        }
        if (!penguji.trim()) {
            alert('Nama penguji harus diisi');
            return;
        }
        const hasEmptyChapter = chapters.some((ch) => !ch.name.trim());
        if (hasEmptyChapter) {
            alert('Nama chapter tidak boleh kosong');
            return;
        }
        const totalBobot = chapters.reduce((sum, ch) => sum + Number(ch.bobot || 0), 0);
        if (Math.abs(totalBobot - 100) > 0.01) {
            alert('Total bobot chapter harus 100%');
            return;
        }
        // Siapkan data sesuai struktur backend
        const data = {
            project_name: projectName.trim(),
            penguji: penguji.trim(),
            catatan: catatan.trim(),
            nilai_final: hasilRealtime.nilaiFinal,
            predikat: hasilRealtime.predikat,
            status: hasilRealtime.nilaiFinal >= 65 ? 'LANJUT' : 'ULANG',
            chapters: chapters.map((ch, idx) => ({
                nama_chapter: ch.name.trim(),
                bobot: ch.bobot,
                aspek: ch.aspek.map((a) => ({
                    nama_aspek: a.name.trim() || `Aspek ${idx + 1}`,
                    sub_aspek: a.subAspek.map((s, subIdx) => ({
                        nama_sub_aspek: s.name.trim() || `Sub Aspek ${subIdx + 1}`,
                        kesalahan: s.kesalahan
                    }))
                }))
            }))
        };
        router.put(`/penilaian/${penilaian.id}`, data, {
            onSuccess: () => {
                window.location.href = '/dashboard';
            },
            onError: (errors) => {
                const errorMessages = Object.values(errors).join('\n');
                alert('Error: ' + errorMessages);
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Edit Lembar Penilaian" />
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-2">Edit Lembar Penilaian</h1>
                <form onSubmit={handleUpdate}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-black mb-1 font-medium">Nama Project</label>
                            <input className="w-full border rounded px-4 py-2" value={projectName} onChange={e => setProjectName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-black mb-1 font-medium">Nama Penguji</label>
                            <input className="w-full border rounded px-4 py-2" value={penguji} onChange={e => setPenguji(e.target.value)} />
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="block text-black mb-1 font-medium">Catatan Penguji</label>
                        <textarea className="w-full border rounded px-4 py-2" value={catatan} onChange={e => setCatatan(e.target.value)} />
                    </div>
                    {/* Chapter Section */}
                    <div className="flex justify-end mb-4">
                        <button type="button" className="bg-gray-200 px-4 py-2 rounded font-semibold w-full md:w-auto" style={{ minWidth: 180 }} onClick={addChapter}>+ Chapter</button>
                    </div>
                    {chapters.map((chapter, chapterIdx) => (
                        <div key={chapterIdx} className="border rounded-lg p-6 mb-6">
                            <div className="mb-4">
                                <input
                                    className="w-full border rounded px-4 py-2 text-center font-semibold text-lg bg-gray-50 mb-2"
                                    value={chapter.name || `Chapter ${chapterIdx + 1}`}
                                    readOnly
                                    tabIndex={-1}
                                    style={{ pointerEvents: 'none' }}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
                                <div className="md:col-span-5">
                                    <label className="block text-black mb-1 font-medium">Nama Chapter</label>
                                    <input className="border rounded px-4 py-2 w-full" placeholder={`Chapter ${chapterIdx + 1}`} value={chapter.name} onChange={e => updateChapter(chapterIdx, 'name', e.target.value)} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-black mb-1 font-medium">Bobot Chapter</label>
                                    <input className="border rounded px-4 py-2 w-full" placeholder="Bobot Chapter (%)" type="number" value={chapter.bobot} onChange={e => updateChapter(chapterIdx, 'bobot', e.target.value)} />
                                </div>
                                <div className="md:col-span-3 flex gap-2">
                                    {chapters.length > 1 && <button type="button" className="bg-red-500 text-white px-4 py-2 rounded font-semibold" onClick={() => removeChapter(chapterIdx)}>Hapus Chapter</button>}
                                </div>
                            </div>
                            <div className="mb-2 font-semibold text-black text-base">Aspek Penilaian</div>
                            {chapter.aspek.map((aspek, aspekIdx) => (
                                <div key={aspekIdx} className="border rounded p-4 mb-4 bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                        <div className="md:col-span-5 min-w-0">
                                            <label className="block text-black mb-1 font-medium">Nama Aspek</label>
                                            <input className="border rounded px-4 py-2 w-full" placeholder="Nama Aspek" value={aspek.name} onChange={e => updateAspek(chapterIdx, aspekIdx, 'name', e.target.value)} />
                                        </div>
                                        <div className="md:col-span-3 flex flex-col justify-end h-full">
                                            <label className="block text-left text-red-600 mb-1 font-bold">Total Kesalahan</label>
                                            <input
                                                className="border rounded px-4 py-2 w-full text-center font-bold bg-red-50 text-red-600"
                                                value={aspek.subAspek.reduce((sum, sa) => sum + Number(sa.kesalahan || 0), 0)}
                                                readOnly
                                                tabIndex={-1}
                                                style={{ pointerEvents: 'none' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="mb-1 font-medium text-black">Sub Aspek</div>
                                        {aspek.subAspek.map((sub, subIdx) => (
                                            <div key={subIdx} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-2 items-center">
                                                <div className="md:col-span-5 min-w-0">
                                                    <input className="border rounded px-4 py-2 w-full" placeholder="Nama Sub Aspek" value={sub.name} onChange={e => updateSubAspek(chapterIdx, aspekIdx, subIdx, 'name', e.target.value)} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <input className="border rounded px-4 py-2 w-full text-center" type="number" min="0" value={sub.kesalahan} onChange={e => updateSubAspek(chapterIdx, aspekIdx, subIdx, 'kesalahan', e.target.value)} />
                                                </div>
                                                <div className="md:col-span-3 flex gap-2">
                                                    {aspek.subAspek.length > 1 && (
                                                        <button type="button" className="bg-red-500 text-white px-4 py-2 rounded font-semibold" onClick={() => removeSubAspek(chapterIdx, aspekIdx, subIdx)}>
                                                            Hapus
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" className="bg-gray-200 text-black px-4 py-2 rounded font-semibold mt-2" onClick={() => addSubAspek(chapterIdx, aspekIdx)}>
                                            + Tambah Sub Aspek
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" className="bg-gray-200 px-4 py-2 rounded mb-2 font-semibold w-full md:w-auto" style={{ minWidth: 180 }} onClick={() => addAspek(chapterIdx)}>+ Tambah Aspek</button>
                        </div>
                    ))}
                    <div className="bg-blue-50 rounded-lg p-6 mt-8">
                        <h3 className="text-xl font-bold mb-4 text-center">Hasil Perhitungan</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Total Kesalahan</div>
                                <div className="text-2xl font-bold text-red-600">{hasilRealtime.totalKesalahan}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Total Nilai</div>
                                <div className="text-2xl font-bold text-blue-700">{hasilRealtime.totalNilai}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Nilai Finalisasi</div>
                                <div className="text-2xl font-bold text-green-600">{hasilRealtime.nilaiFinal}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">Predikat</div>
                                <div className="text-2xl font-bold text-blue-700">{hasilRealtime.predikat}</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 mt-8">
                        <button type="submit" className="bg-black text-white px-6 py-2 rounded shadow font-semibold flex-1">Simpan Perubahan</button>
                        <a href="/dashboard" className="bg-gray-200 text-black px-6 py-2 rounded shadow font-semibold flex-1 text-center">Batal</a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
