import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Tambahkan tipe untuk props
interface SubAspek { nama_sub_aspek: string; kesalahan: number; }
interface Aspek { nama_aspek: string; sub_aspeks?: SubAspek[]; }
interface Chapter { nama_chapter: string; bobot: number; aspeks?: Aspek[]; }
interface Penilaian {
    id: number;
    project_name: string;
    penguji: string;
    catatan: string;
    nilai_final: number;
    predikat: string;
    status: string;
    chapters?: Chapter[];
}
interface Summary {
    totalPenilaian: number;
    rataRataNilai: number;
    statusLanjut: number;
    statusUlang: number;
}
interface DashboardProps {
    penilaians: Penilaian[];
    summary: Summary;
}

export default function Dashboard({ penilaians = [], summary = { totalPenilaian: 0, rataRataNilai: 0, statusLanjut: 0, statusUlang: 0 } }: DashboardProps) {
    // Fungsi hapus penilaian
    const handleDelete = (id: number) => {
        if (confirm('Yakin hapus lembar penilaian ini?')) {
            router.delete(`/penilaian/${id}`, {
                onSuccess: () => {
                    // Inertia otomatis refresh dashboard
                }
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border bg-transparent flex items-center justify-center">
                    <div className="w-full max-w-5xl mx-auto">
                        <div className="text-center mb-8">
                            <h1 className="mb-4 text-center text-2xl font-semibold text-black">Website lembar penilaian project</h1>
                            <a href="/create-sheet" className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-400">Buat lembar penilaian baru</a>
                        </div>
                        {/* Summary Box */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6 text-center">
                                <div className="text-xs text-gray-500 mb-1">Total Penilaian</div>
                                <div className="text-2xl font-bold text-blue-700">{summary.totalPenilaian}</div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6 text-center">
                                <div className="text-xs text-gray-500 mb-1">Rata-rata Nilai</div>
                                <div className="text-2xl font-bold text-green-600">{Number(summary.rataRataNilai).toFixed(1)}</div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6 text-center">
                                <div className="text-xs text-gray-500 mb-1">Status Lanjut</div>
                                <div className="text-2xl font-bold text-green-600">{summary.statusLanjut}</div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6 text-center">
                                <div className="text-xs text-gray-500 mb-1">Status Ulang</div>
                                <div className="text-2xl font-bold text-red-600">{summary.statusUlang}</div>
                            </div>
                        </div>
                        {/* List Penilaian */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            {penilaians.map((sheet, idx) => (
                                <div key={sheet.id} className="bg-white rounded-xl shadow p-6">
                                    <div className="text-xl font-bold mb-2">{sheet.project_name || `Project ${idx + 1}`}</div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                                            <div className="text-xs text-blue-700 mb-1 font-semibold">Total Kesalahan</div>
                                            <div className="text-2xl font-bold text-red-600">{sheet.chapters?.reduce((sum, ch) => sum + (ch.aspeks?.reduce((a, asp) => a + (asp.sub_aspeks?.reduce((b, sa) => b + (sa.kesalahan || 0), 0) || 0), 0) || 0), 0) ?? '-'}</div>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-4 text-center">
                                            <div className="text-xs text-green-700 mb-1 font-semibold">Total Nilai</div>
                                            <div className="text-2xl font-bold text-blue-700">{sheet.nilai_final ?? '-'}</div>
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-4 text-center mb-4">
                                        <div className="text-xs text-purple-700 mb-1 font-semibold">Nilai Finalisasi</div>
                                        <div className="text-2xl font-bold text-green-600">{sheet.nilai_final ?? '-'}</div>
                                    </div>
                                    <div className="mb-2">Predikat: <span className="font-semibold">{sheet.predikat}</span></div>
                                    <div className="mb-2">Status: <span className="font-semibold text-green-600">{sheet.status}</span></div>
                                    <div className="mb-2">Chapter: <span className="font-semibold">{sheet.chapters?.length ?? '-'}</span> &nbsp; Total Aspek: <span className="font-semibold">{sheet.chapters?.reduce((sum, ch) => sum + (ch.aspeks?.length || 0), 0)}</span></div>
                                    <div className="flex gap-2 mt-4">
                                        <a href={`/penilaian/${sheet.id}/edit`} className="flex-1 border px-4 py-2 rounded font-semibold text-center">Edit</a>
                                        <button type="button" onClick={() => handleDelete(sheet.id)} className="flex-1 bg-red-500 text-white px-4 py-2 rounded font-semibold">Hapus</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
