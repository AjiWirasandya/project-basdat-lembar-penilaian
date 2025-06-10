import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';

// Tambahkan tipe untuk import JSON agar tidak dianggap {} oleh TypeScript
// @ts-ignore
import rumus from '../lib/rumus-penilaian.json';

function getDefaultSubAspek() {
    return [{ name: '', kesalahan: 0 }];
}
function getDefaultAspek() {
    return {
        name: '',
        subAspek: getDefaultSubAspek(),
    };
}
function getDefaultChapter() {
    return {
        name: 'Chapter 1',
        bobot: 100,
        aspek: [getDefaultAspek()],
    };
}

// Tambahkan tipe untuk sheet summary
interface SheetSummary {
    projectName: string;
    totalKesalahan: number;
    totalNilai: number;
    nilaiFinal: number;
    predikat: string;
    status: string;
    chapterCount: number;
    aspekCount: number;
}

function hitungNilaiFinal(chapters: any[]): { totalKesalahan: number, totalNilai: number, nilaiFinal: number, predikat: string } {
    // @ts-ignore
    const nilaiMaks = rumus.nilai_maksimum;
    // Hitung total kesalahan per chapter
    const chapterResults = chapters.map((ch: any) => {
        const totalKesalahan = ch.aspek.reduce((a: number, asp: any) => a + asp.subAspek.reduce((b: number, sa: any) => b + Number(sa.kesalahan || 0), 0), 0);
        const totalNilai = nilaiMaks - totalKesalahan;
        return { bobot: Number(ch.bobot), totalKesalahan, totalNilai };
    });
    const sumBobot = chapterResults.reduce((a: number, c: any) => a + c.bobot, 0);
    const sumBobotNilai = chapterResults.reduce((a: number, c: any) => a + (c.bobot * c.totalNilai), 0);
    const nilaiFinal = sumBobot ? Math.round((sumBobotNilai / sumBobot) * 10) / 10 : 0;
    const totalKesalahan = chapterResults.reduce((a: number, c: any) => a + c.totalKesalahan, 0);
    // @ts-ignore
    let predikat = "Cukup";
    // @ts-ignore
    for (const p of rumus.predikat) {
        if (nilaiFinal >= p.min && nilaiFinal <= p.max) {
            predikat = p.label;
            break;
        }
    }
    return { totalKesalahan, totalNilai: Math.round(nilaiFinal), nilaiFinal, predikat };
}

export default function CreateSheet() {
    const [projectName, setProjectName] = useState('');
    const [penguji, setPenguji] = useState('');
    const [catatan, setCatatan] = useState('');
    const [chapters, setChapters] = useState([getDefaultChapter()]);
    const [savedSheets, setSavedSheets] = useState<SheetSummary[]>([]);
    const [showSummary, setShowSummary] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);

    // Reset form
    const resetForm = () => {
        setProjectName('');
        setPenguji('');
        setCatatan('');
        setChapters([getDefaultChapter()]);
    };

    // Handler untuk chapter
    const addChapter = () => setChapters([...chapters, getDefaultChapter()]);
    const removeChapter = (idx: number) => setChapters(chapters.filter((_, i) => i !== idx));
    const updateChapter = (idx: number, key: string, value: any) => {
        setChapters(chapters.map((c, i) => i === idx ? { ...c, [key]: value } : c));
    };

    // Handler untuk aspek
    const addAspek = (chapterIdx: number) => {
        setChapters(chapters.map((c, i) => i === chapterIdx ? { ...c, aspek: [...c.aspek, getDefaultAspek()] } : c));
    };
    const removeAspek = (chapterIdx: number, aspekIdx: number) => {
        setChapters(chapters.map((c, i) => i === chapterIdx ? { ...c, aspek: c.aspek.filter((_, j) => j !== aspekIdx) } : c));
    };
    const updateAspek = (chapterIdx: number, aspekIdx: number, key: string, value: any) => {
        setChapters(chapters.map((c, i) => i === chapterIdx ? {
            ...c,
            aspek: c.aspek.map((a, j) => j === aspekIdx ? { ...a, [key]: value } : a)
        } : c));
    };

    // Handler untuk sub aspek
    const addSubAspek = (chapterIdx: number, aspekIdx: number) => {
    setChapters(chapters.map((c, i) => i === chapterIdx ? {
        ...c,
        aspek: c.aspek.map((a, j) => j === aspekIdx ? { ...a, subAspek: [...a.subAspek, { name: '', kesalahan: 0 }] } : a)
    } : c));
};
    const removeSubAspek = (chapterIdx: number, aspekIdx: number, subIdx: number) => {
        setChapters(chapters.map((c, i) => i === chapterIdx ? {
            ...c,
            aspek: c.aspek.map((a, j) => j === aspekIdx ? { ...a, subAspek: a.subAspek.filter((_, k) => k !== subIdx) } : a)
        } : c));
    };
    const updateSubAspek = (chapterIdx: number, aspekIdx: number, subIdx: number, key: string, value: any) => {
        setChapters(chapters.map((c, i) => i === chapterIdx ? {
            ...c,
            aspek: c.aspek.map((a, j) => j === aspekIdx ? {
                ...a,
                subAspek: a.subAspek.map((s, k) => k === subIdx ? { ...s, [key]: value } : s)
            } : a)
        } : c));
    };

    // Simpan penilaian handler
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi semua field yang diperlukan
        if (!projectName.trim()) {
            alert('Nama project harus diisi');
            return;
        }
        if (!penguji.trim()) {
            alert('Nama penguji harus diisi');
            return;
        }

        // Validasi nama chapter
        const hasEmptyChapter = chapters.some(ch => !ch.name.trim());
        if (hasEmptyChapter) {
            alert('Nama chapter tidak boleh kosong');
            return;
        }

        // Validasi bobot chapter
        const totalBobot = chapters.reduce((sum, ch) => sum + Number(ch.bobot || 0), 0);
        if (Math.abs(totalBobot - 100) > 0.01) {  // Using small epsilon for float comparison
            alert('Total bobot chapter harus 100%');
            return;
        }

        const hasil = hitungNilaiFinal(chapters);
        // Siapkan data sesuai struktur backend
        const data = {
            project_name: projectName.trim(),
            penguji: penguji.trim(),
            catatan: catatan.trim(),
            nilai_final: hasil.nilaiFinal,
            predikat: hasil.predikat,
            status: hasil.nilaiFinal >= 65 ? 'LANJUT' : 'ULANG',
            chapters: chapters.map((ch, idx) => ({
                nama_chapter: ch.name.trim(),
                bobot: ch.bobot,
                aspek: ch.aspek.map(a => ({
                    nama_aspek: a.name.trim() || `Aspek ${idx + 1}`,
                    sub_aspek: a.subAspek.map((s, subIdx) => ({
                        nama_sub_aspek: s.name.trim() || `Sub Aspek ${subIdx + 1}`,
                        kesalahan: s.kesalahan
                    }))
                }))
            }))
        };

        router.post('/penilaian', data, {
            onSuccess: () => {
                window.location.href = '/dashboard'; // Redirect ke dashboard setelah berhasil
            },
            onError: (errors) => {
                // Tampilkan error dari backend jika ada
                const errorMessages = Object.values(errors).join('\n');
                alert('Error: ' + errorMessages);
            }
        });
    };

    // Edit sheet
    const handleEdit = (idx: number) => {
        const sheet = savedSheets[idx];
        setProjectName(sheet.projectName);
        // Data lain (penguji, catatan, chapters) bisa di-extend jika ingin edit penuh
        setShowSummary(false);
        setEditIndex(idx);
    };

    // Hapus sheet
    const handleDelete = (idx: number) => {
        setSavedSheets(savedSheets.filter((_, i) => i !== idx));
    };

    // Hasil Perhitungan
    const hasilRealtime = hitungNilaiFinal(chapters);

    return (
        <AppLayout>
            <Head title="Lembar Penilaian Project" />
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-2">Lembar Penilaian Project</h1>
                <p className="text-center text-gray-600 mb-6">Sistem penilaian berbasis chapter dengan perhitungan kesalahan dan bobot</p>
                {/* Summary Box */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <div className="text-xs text-gray-500 mb-1">Total Penilaian</div>
                        <div className="text-2xl font-bold text-blue-700">0</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <div className="text-xs text-gray-500 mb-1">Rata-rata Nilai</div>
                        <div className="text-2xl font-bold text-green-600">0.0</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <div className="text-xs text-gray-500 mb-1">Status Lanjut</div>
                        <div className="text-2xl font-bold text-green-600">0</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <div className="text-xs text-gray-500 mb-1">Status Ulang</div>
                        <div className="text-2xl font-bold text-red-600">0</div>
                    </div>
                </div>
                {/* Form Box */}
                <div className="bg-white rounded-lg shadow p-8 mb-8">
                    <h2 className="text-2xl font-bold text-center mb-8">Lembar Penilaian Baru</h2>
                    {showSummary ? (
                        <div>
                            <div className="flex justify-center mb-8">
                                <button className="bg-gradient-to-b from-blue-500 to-blue-700 text-white px-8 py-2 rounded shadow font-semibold text-base hover:from-blue-600 hover:to-blue-800" onClick={() => { setShowSummary(false); resetForm(); setEditIndex(null); }}>Buat Penilaian Baru</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                                {savedSheets.map((sheet, idx) => (
                                    <div key={idx} className="bg-white rounded-xl shadow p-6">
                                        <div className="text-xl font-bold mb-2">{sheet.projectName || `Project ${idx + 1}`}</div>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                                <div className="text-xs text-blue-700 mb-1 font-semibold">Total Kesalahan</div>
                                                <div className="text-2xl font-bold text-red-600">{sheet.totalKesalahan}</div>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                                <div className="text-xs text-green-700 mb-1 font-semibold">Total Nilai</div>
                                                <div className="text-2xl font-bold text-blue-700">{sheet.totalNilai}</div>
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-4 text-center mb-4">
                                            <div className="text-xs text-purple-700 mb-1 font-semibold">Nilai Finalisasi</div>
                                            <div className="text-2xl font-bold text-green-600">{sheet.nilaiFinal}</div>
                                        </div>
                                        <div className="mb-2">Predikat: <span className="font-semibold">{sheet.predikat}</span></div>
                                        <div className="mb-2">Status: <span className="font-semibold text-green-600">{sheet.status}</span></div>
                                        <div className="mb-2">Chapter: <span className="font-semibold">{sheet.chapterCount}</span> &nbsp; Total Aspek: <span className="font-semibold">{sheet.aspekCount}</span></div>
                                        <div className="flex gap-2 mt-4">
                                            <button className="flex-1 border px-4 py-2 rounded font-semibold" onClick={() => handleEdit(idx)}>Edit</button>
                                            <button className="flex-1 bg-red-500 text-white px-4 py-2 rounded font-semibold" onClick={() => handleDelete(idx)}>Hapus</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-black mb-1 font-medium">Nama Project</label>
                                    <input className="w-full border rounded px-4 py-2" placeholder="Nama Project" value={projectName} onChange={e => setProjectName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-black mb-1 font-medium">Nama Penguji</label>
                                    <input className="w-full border rounded px-4 py-2" placeholder="Nama penguji" value={penguji} onChange={e => setPenguji(e.target.value)} />
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-black mb-1 font-medium">Catatan Penguji</label>
                                <textarea className="w-full border rounded px-4 py-2" placeholder="Masukkan catatan penguji" value={catatan} onChange={e => setCatatan(e.target.value)} />
                            </div>
                            {/* Chapter Section */}
                            <div className="flex justify-end mb-4">
                                <button type="button" className="bg-gray-200 px-4 py-2 rounded font-semibold w-full md:w-auto" style={{ minWidth: 180 }} onClick={addChapter}>+ Chapter</button>
                            </div>
                            {chapters.map((chapter, chapterIdx) => (
                                <div key={chapterIdx} className="border rounded-lg p-6 mb-6">
                                    {/* Nama Chapter di atas form, auto update sesuai input */}
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
                                    {/* Aspek Penilaian */}
                                    <div className="mb-2 font-semibold text-black text-base">Aspek Penilaian</div>
                                    {chapter.aspek.map((aspek, aspekIdx) => (
                                        <div key={aspekIdx} className="border rounded p-4 mb-4 bg-white">
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                                <div className="md:col-span-5 min-w-0">
                                                    <label className="block text-black mb-1 font-medium">Nama Aspek</label>
                                                    <input className="border rounded px-4 py-2 w-full" placeholder="Nama Aspek" value={aspek.name} onChange={e => updateAspek(chapterIdx, aspekIdx, 'name', e.target.value)} />
                                                </div>
                                                {/* Total Kesalahan di samping Nama Aspek, sejajar dengan input kesalahan subaspek */}
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
                                    {/* Tambah Aspek */}
                                    <button type="button" className="bg-gray-200 px-4 py-2 rounded mb-2 font-semibold w-full md:w-auto" style={{ minWidth: 180 }} onClick={() => addAspek(chapterIdx)}>+ Tambah Aspek</button>
                                </div>
                            ))}
                            {/* Hasil Perhitungan */}
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
                            {/* Tombol Aksi */}
                            <div className="flex flex-col md:flex-row gap-4 mt-8">
                                <button type="submit" className="bg-black text-white px-6 py-2 rounded shadow font-semibold flex-1">Simpan Penilaian</button>
                                <button type="button" className="bg-gray-200 text-black px-6 py-2 rounded shadow font-semibold flex-1" onClick={() => { setShowSummary(true); setEditIndex(null); }}>Batal</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}