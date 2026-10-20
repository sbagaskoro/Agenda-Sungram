import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  FileText, 
  User, 
  Calendar, 
  Image as ImageIcon, 
  AlertCircle, 
  UploadCloud, 
  Building, 
  Sparkles, 
  ShieldCheck,
  Printer
} from 'lucide-react';
import { AgendaItem, Employee, AgendaReport, AgendaReportPhoto, NotaDinasConfig } from '../types';
import { 
  buildSystematicReportTemplate, 
  FULL_EXAMPLE_KKS_REPORT 
} from '../utils/reportTemplate';
import { formatNip } from '../utils/nameFormatter';
import { NotaDinasModal } from './NotaDinasModal';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  agenda: AgendaItem | null;
  employees: Employee[];
  onSaveReport: (agendaId: string, reportData: AgendaReport) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  agenda,
  employees,
  onSaveReport,
}) => {
  const [reportedByEmployeeId, setReportedByEmployeeId] = useState('');
  const [executionNotes, setExecutionNotes] = useState('');
  const [followUpAction, setFollowUpAction] = useState('');
  const [photos, setPhotos] = useState<AgendaReportPhoto[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isNotaDinasOpen, setIsNotaDinasOpen] = useState(false);

  // Assigned staff for this agenda
  const assignedStaff = employees.filter((e) =>
    agenda?.disposition?.assignedEmployeeIds?.includes(e.id)
  );

  // Fallback to all staff if none assigned yet
  const selectableStaff = assignedStaff.length > 0 ? assignedStaff : employees.filter((e) => e.id !== 'emp-head');

  useEffect(() => {
    if (agenda) {
      if (agenda.report && agenda.report.executionNotes) {
        setReportedByEmployeeId(agenda.report.reportedByEmployeeId || '');
        setExecutionNotes(agenda.report.executionNotes);
        setFollowUpAction(agenda.report.followUpAction || '');
        setPhotos(agenda.report.photos ? [...agenda.report.photos] : []);
      } else {
        // Pre-select first assigned staff member
        const defaultStaff = selectableStaff[0]?.id || '';
        setReportedByEmployeeId(defaultStaff);
        // Automatically prefill with systematic dinas template tailored for this agenda
        setExecutionNotes(buildSystematicReportTemplate(agenda));
        setFollowUpAction('Menindaklanjuti rekomendasi rapat dan mengoordinasikan laporan akhir.');
        // No sample photos recommendation - user uploads their own documentation
        setPhotos([]);
      }
      setErrorMsg('');
    }
  }, [agenda, isOpen]);

  if (!isOpen || !agenda) return null;

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList: File[] = Array.from(e.target.files);
      fileList.forEach((file: File, index: number) => {
        const reader = new FileReader();
        reader.onload = () => {
          const newPhoto: AgendaReportPhoto = {
            id: `photo-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
            url: reader.result as string,
            caption: file.name.replace(/\.[^/.]+$/, ''),
            uploadedAt: new Date().toISOString().split('T')[0],
          };
          setPhotos((prev) => [...prev, newPhoto]);
        };
        reader.readAsDataURL(file);
      });
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportedByEmployeeId) {
      setErrorMsg('Pilih nama staf terdisposisi yang membuat laporan.');
      return;
    }

    if (!executionNotes.trim()) {
      setErrorMsg('Hasil ringkasan pelaksanaan kegiatan wajib diisi.');
      return;
    }

    const reporter = employees.find((e) => e.id === reportedByEmployeeId);

    onSaveReport(agenda.id, {
      reportedByEmployeeId,
      reportedByName: reporter?.name || 'Staf Subbag Sungram',
      reportedAt: new Date().toISOString(),
      executionNotes: executionNotes.trim(),
      followUpAction: followUpAction.trim(),
      photos,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        id="modal-report"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Laporan Hasil Pelaksanaan Disposisi
              </h3>
              <p className="text-xs text-emerald-100/80">
                Pindahkan ke Planner C (Completed/Selesai): Diisi oleh Staf Terdisposisi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNotaDinasOpen(true)}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 shadow-2xs"
              title="Buka format resmi Nota Dinas ber-Kop Dishub Jatim"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Buat Nota Dinas Ber-Kop</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Agenda & Disposition Context */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-slate-800 text-[11px] bg-slate-200/70 px-2 py-0.5 rounded">
                No: {agenda.letterNumber}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">
                Waktu Acara: {agenda.eventDate} ({agenda.startTime} - {agenda.endTime})
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm leading-snug">
              {agenda.subject}
            </h4>

            {agenda.disposition && (
              <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-lg space-y-1 text-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Arahan Disposisi ({agenda.disposition.disposerName}):</span>
                </div>
                <p className="text-[11px] text-slate-600 italic">
                  "{agenda.disposition.disposerNote}"
                </p>
              </div>
            )}
          </div>

          {/* Field 1: Staf Terdisposisi yang Melaporkan */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Staf Terdisposisi yang Melaporkan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={reportedByEmployeeId}
                onChange={(e) => setReportedByEmployeeId(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
              >
                {selectableStaff.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role} {emp.nip ? `(NIP ${formatNip(emp.nip)})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Pilih nama Anda atau rekan staf yang ditugaskan dalam surat disposisi ini
            </p>
          </div>

          {/* Field 2: Ringkasan Hasil Pelaksanaan Sesuai Sistematika Naskah Dinas */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Format Sistematika Laporan Hasil Kegiatan</span>
                <span className="text-rose-500">*</span>
              </label>

              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setExecutionNotes(buildSystematicReportTemplate(agenda))}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold transition-colors flex items-center gap-1"
                  title="Terapkan kembali sistematika template dinas untuk agenda ini"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Template Agenda Ini</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExecutionNotes(FULL_EXAMPLE_KKS_REPORT)}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold transition-colors flex items-center gap-1"
                  title="Gunakan contoh lengkap giat Pembinaan KKS Tingkat Provinsi"
                >
                  <span>Contoh Giat KKS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExecutionNotes('')}
                  className="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Bersihkan
                </button>
              </div>
            </div>

            {/* Sistematika Guide Pills */}
            <div className="mb-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center gap-2 text-[10px] text-slate-600 flex-wrap">
              <span className="font-bold text-slate-800 uppercase tracking-wide">Sistematika Naskah:</span>
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium text-slate-700">I. PELAKSANAAN</span>
              <span className="text-slate-300">•</span>
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium text-slate-700">II. HADIR DALAM KEGIATAN</span>
              <span className="text-slate-300">•</span>
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium text-slate-700">III. SUBSTANSI</span>
              <span className="text-slate-300">•</span>
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium text-slate-700">IV. TINDAK LANJUT</span>
            </div>

            {/* Quick Action: Buat Nota Dinas Ber-Kop Resmi */}
            <div className="mb-2.5 p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 flex-wrap shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    Naskah Nota Dinas / Notulen Ber-Kop Resmi
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Kop resmi Pemprov Jawa Timur, Dinas Perhubungan. Substansi dapat disesuaikan bebas & siap cetak PDF.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNotaDinasOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buka / Buat Nota Dinas</span>
              </button>
            </div>

            <textarea
              rows={12}
              value={executionNotes}
              onChange={(e) => setExecutionNotes(e.target.value)}
              placeholder="Ketik atau sesuaikan laporan pelaksanaan kegiatan dengan mengikuti sistematika I. Pelaksanaan, II. Hadir, III. Substansi, IV. Tindak Lanjut..."
              required
              className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Template di atas otomatis disesuaikan dengan data surat, hari, tanggal, dan lokasi pelaksanaan agenda ini.
            </p>
          </div>

          {/* Field 3: Tindak Lanjut Lanjutan */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Rekomendasi Tindak Lanjut Berikutnya
            </label>
            <input
              type="text"
              value={followUpAction}
              onChange={(e) => setFollowUpAction(e.target.value)}
              placeholder="Contoh: Mengunggah matriks revisi ke portal pengawasan daerah dalam 3 hari kerja"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Field 4: Foto / Bukti Dokumentasi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Foto Dokumentasi Kegiatan ({photos.length})</span>
              </label>

              <label className="cursor-pointer px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>+ Unggah Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddPhoto}
                  className="hidden"
                />
              </label>
            </div>

            {photos.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {photos.map((p) => (
                    <div
                      key={p.id}
                      className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-xs"
                    >
                      <img
                        src={p.url}
                        alt={p.caption}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-90 p-2 flex flex-col justify-end">
                        <p className="text-[10px] text-white font-medium truncate">
                          {p.caption}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="Hapus foto ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <label className="cursor-pointer text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1">
                    <UploadCloud className="w-3 h-3" />
                    <span>Tambah foto lagi</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAddPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/30 rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-emerald-600 mb-1.5 transition-colors" />
                <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                  Pilih atau Unggah Foto Dokumentasi
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Klik di sini untuk memilih foto kegiatan dari perangkat Anda (JPG, PNG, WEBP)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddPhoto}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Workflow Note */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p>
              Setelah laporan disimpan, kartu agenda akan dipindahkan ke <strong>Planner C (Completed/Selesai)</strong> dengan status tuntas.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Batal
            </button>
            <button
              id="btn-save-report-completed"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simpan Laporan & Geser ke Planner C</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal Format Nota Dinas Ber-Kop Resmi */}
      <NotaDinasModal
        isOpen={isNotaDinasOpen}
        onClose={() => setIsNotaDinasOpen(false)}
        agenda={{
          ...agenda,
          report: {
            reportedByEmployeeId,
            reportedByName: employees.find((e) => e.id === reportedByEmployeeId)?.name || 'Staf Subbag Sungram',
            reportedAt: new Date().toISOString(),
            executionNotes,
            followUpAction,
            photos,
          },
        }}
        employees={employees}
        initialNotes={executionNotes}
        onSaveToReport={(_id, updatedNotes) => {
          setExecutionNotes(updatedNotes);
          setIsNotaDinasOpen(false);
        }}
      />
    </div>
  );
};
