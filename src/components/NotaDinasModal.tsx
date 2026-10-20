import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  Edit3, 
  Eye, 
  FileText, 
  Save, 
  Sparkles, 
  RotateCcw,
  Calendar,
  User,
  Shield,
  Image as ImageIcon
} from 'lucide-react';
import { AgendaItem, Employee, NotaDinasConfig } from '../types';
import { OfficialKopDinas } from './OfficialKopDinas';
import { 
  formatDateIndo, 
  getDayNameIndo, 
  buildNotaDinasSubstanceTemplate, 
  buildNotulenKinerjaSubstanceTemplate,
  buildSystematicReportTemplate
} from '../utils/reportTemplate';
import { formatEmployeeName, formatNip } from '../utils/nameFormatter';

interface NotaDinasModalProps {
  isOpen: boolean;
  onClose: () => void;
  agenda: AgendaItem | null;
  employees: Employee[];
  initialNotes?: string;
  onSaveToReport?: (agendaId: string, updatedNotes: string, notaConfig?: NotaDinasConfig) => void;
}

export const NotaDinasModal: React.FC<NotaDinasModalProps> = ({
  isOpen,
  onClose,
  agenda,
  employees,
  initialNotes,
  onSaveToReport,
}) => {
  // Document Type: 'NOTA_DINAS' vs 'NOTULEN_RAPAT'
  const [docType, setDocType] = useState<'NOTA_DINAS' | 'NOTULEN_RAPAT'>('NOTA_DINAS');
  const [customTitle, setCustomTitle] = useState('NOTA DINAS');
  
  // Header Meta
  const [nomorNota, setNomorNota] = useState('');
  const [kepada, setKepada] = useState('Kepala Sub Bagian Penyusunan Program dan Anggaran, Dinas Perhubungan Provinsi Jawa Timur');
  const [dari, setDari] = useState('');
  const [tanggalNota, setTanggalNota] = useState('');
  const [sifat, setSifat] = useState<'Biasa' | 'Penting' | 'Segera' | 'Sangat Segera'>('Penting');
  const [lampiran, setLampiran] = useState('1 (satu) Berkas');
  const [hal, setHal] = useState('');

  // Substance Body
  const [substansi, setSubstansi] = useState('');

  // Signatory
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerNip, setSignerNip] = useState('');
  const [signerRole, setSignerRole] = useState('');
  const [signLocationDate, setSignLocationDate] = useState('');

  // Photos
  const [includePhotos, setIncludePhotos] = useState(true);

  // View state
  const [activeTab, setActiveTab] = useState<'preview' | 'editor'>('preview');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize data from agenda & employees
  useEffect(() => {
    if (!agenda) return;

    // Pick reporter or first assigned staff
    const assignedIds = agenda.disposition?.assignedEmployeeIds || [];
    const reporterId = agenda.report?.reportedByEmployeeId || assignedIds[0] || 'emp-donny';
    const reporter = employees.find((e) => e.id === reporterId) || employees[1];

    const formattedSignerName = formatEmployeeName(agenda.report?.reportedByName || reporter?.name || 'Staf Subbag Sungram');
    const todayFormatted = formatDateIndo(agenda.eventDate || new Date().toISOString().split('T')[0]);

    setSelectedStaffId(reporter?.id || '');
    setSignerName(formattedSignerName);
    setSignerNip(reporter?.nip ? formatNip(reporter.nip) : '198210122025211139');
    setSignerRole(reporter?.role || 'Penata Layanan Operasional');
    setDari(formattedSignerName);

    setTanggalNota(todayFormatted);
    setSignLocationDate(`Surabaya, ${todayFormatted}`);

    const existingNomor = agenda.letterNumber ? agenda.letterNumber.replace(/^[^/]+/, '000.1.2') : `000.1.2/${Math.floor(100 + Math.random() * 900)}/113.4/2026`;
    setNomorNota(existingNomor);

    setHal(`Laporan Hasil Pelaksanaan ${agenda.subject}`);

    // Set substance: prioritize saved report note, initialNotes, or template
    if (agenda.report?.executionNotes) {
      setSubstansi(agenda.report.executionNotes);
    } else if (initialNotes) {
      setSubstansi(initialNotes);
    } else {
      setSubstansi(buildNotaDinasSubstanceTemplate(agenda));
    }

    setSavedSuccess(false);
  }, [agenda, isOpen, employees, initialNotes]);

  // Handle docType toggle
  const handleSwitchDocType = (type: 'NOTA_DINAS' | 'NOTULEN_RAPAT') => {
    setDocType(type);
    if (type === 'NOTA_DINAS') {
      setCustomTitle('NOTA DINAS');
    } else {
      setCustomTitle('NOTULEN RAPAT KINERJA DAN EVALUASI KINERJA');
    }
  };

  // Signer change
  const handleStaffChange = (empId: string) => {
    setSelectedStaffId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      const cleanName = formatEmployeeName(emp.name);
      setSignerName(cleanName);
      setSignerNip(emp.nip ? formatNip(emp.nip) : '-');
      setSignerRole(emp.role);
      setDari(cleanName);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Copy text to clipboard
  const handleCopyText = async () => {
    let fullText = `PEMERINTAH PROVINSI JAWA TIMUR\nDINAS PERHUBUNGAN\nJalan Ahmad Yani Nomor 268, Menanggal, Gayungan, Surabaya, Jawa Timur 60234\nTelepon (031) 8222276-8221530\n=======================================================\n\n`;

    fullText += `${customTitle}\n`;
    if (docType === 'NOTA_DINAS') {
      fullText += `Nomor    : ${nomorNota}\n`;
      fullText += `Kepada   : ${kepada}\n`;
      fullText += `Dari     : ${dari}\n`;
      fullText += `Tanggal  : ${tanggalNota}\n`;
      fullText += `Sifat    : ${sifat}\n`;
      fullText += `Hal      : ${hal}\n\n`;
    }

    fullText += `${substansi}\n\n`;
    fullText += `${signLocationDate}\nPelapor / Pembuat Naskah,\n\n${signerName}\nNIP ${formatNip(signerNip)}\n${signerRole}\n`;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy text', e);
    }
  };

  // Save changes back to Agenda report
  const handleSaveSubstance = () => {
    if (!agenda || !onSaveToReport) return;

    const config: NotaDinasConfig = {
      documentType: docType,
      customTitle,
      nomorNota,
      kepada,
      dari,
      tanggalNota,
      sifat,
      lampiran,
      hal,
      substansiNotes: substansi,
      tempatTanggalTtd: signLocationDate,
      penandatanganNama: signerName,
      penandatanganNip: signerNip,
      penandatanganJabatan: signerRole,
      includePhotos,
    };

    onSaveToReport(agenda.id, substansi, config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!isOpen || !agenda) return null;

  const photos = agenda.report?.photos || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible">
      {/* Container Modal */}
      <div 
        id="nota-dinas-modal-container"
        className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 max-w-5xl w-full my-4 overflow-hidden flex flex-col max-h-[94vh] print:max-w-none print:w-full print:m-0 print:border-none print:shadow-none print:bg-white print:max-h-none print:overflow-visible"
      >
        {/* Top Control Header - Hidden during print */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-100 truncate flex items-center gap-2">
                <span>Naskah Dinas Ber-Kop Resmi (Pemprov Jawa Timur)</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dishub Jatim
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Agenda: {agenda.letterNumber} &bull; {agenda.subject}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau Kertas A4</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'editor'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sesuaikan Substansi</span>
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
              title="Cetak dokumen atau simpan sebagai file PDF A4 resmi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all border border-slate-700"
              title="Salin seluruh teks naskah dinas ke clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Bar: Format Selector & Save Status - Hidden during print */}
        <div className="px-5 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Pilihan Format Dokumen:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSwitchDocType('NOTA_DINAS')}
                className={`px-3 py-1 text-xs rounded-lg font-bold border transition-colors ${
                  docType === 'NOTA_DINAS'
                    ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                1. Format Nota Dinas Resmi
              </button>
              <button
                type="button"
                onClick={() => handleSwitchDocType('NOTULEN_RAPAT')}
                className={`px-3 py-1 text-xs rounded-lg font-bold border transition-colors ${
                  docType === 'NOTULEN_RAPAT'
                    ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                2. Format Notulen Rapat Kinerja (Sesuai Referensi PDF)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>Substansi tersimpan ke laporan agenda!</span>
              </span>
            )}
            {onSaveToReport && (
              <button
                type="button"
                onClick={handleSaveSubstance}
                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                title="Simpan penyesuaian substansi ke agenda"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan ke Laporan Agenda</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Switch between Editor and A4 Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0 print:overflow-visible bg-slate-200/60 print:bg-white">
          {activeTab === 'editor' ? (
            /* EDITOR PANEL: CUSTOMIZE SUBSTANCE & META */
            <div className="max-w-3xl mx-auto bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Sesuaikan Naskah & Substansi Nota Dinas
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat Pratinjau Kertas</span>
                </button>
              </div>

              {/* Template Quick Picks */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/70 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pilihan Template Teks Otomatis:</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSubstansi(buildNotaDinasSubstanceTemplate(agenda));
                      handleSwitchDocType('NOTA_DINAS');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg font-semibold transition-colors shadow-2xs"
                  >
                    Template Nota Dinas Resmi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubstansi(buildNotulenKinerjaSubstanceTemplate(agenda));
                      handleSwitchDocType('NOTULEN_RAPAT');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg font-semibold transition-colors shadow-2xs"
                  >
                    Template Notulen Rapat (Referensi PDF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubstansi(buildSystematicReportTemplate(agenda))}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg font-semibold transition-colors shadow-2xs"
                  >
                    Template Sistematika Dinas (I - IV)
                  </button>
                </div>
              </div>

              {/* Header Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Judul Naskah Dokumen
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nomor Naskah Dinas
                  </label>
                  <input
                    type="text"
                    value={nomorNota}
                    onChange={(e) => setNomorNota(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {docType === 'NOTA_DINAS' && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">
                        Kepada Yth.
                      </label>
                      <input
                        type="text"
                        value={kepada}
                        onChange={(e) => setKepada(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Dari (Pembuat Nota Dinas)
                      </label>
                      <input
                        type="text"
                        value={dari}
                        onChange={(e) => setDari(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Sifat Surat / Naskah
                      </label>
                      <select
                        value={sifat}
                        onChange={(e) => setSifat(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                      >
                        <option value="Biasa">Biasa</option>
                        <option value="Penting">Penting</option>
                        <option value="Segera">Segera</option>
                        <option value="Sangat Segera">Sangat Segera</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">
                        Hal / Perihal
                      </label>
                      <input
                        type="text"
                        value={hal}
                        onChange={(e) => setHal(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Main Substance Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Isi / Substansi Nota Dinas (Bisa Disesuaikan Bebas)</span>
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSubstansi(buildNotaDinasSubstanceTemplate(agenda))}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold transition-colors flex items-center gap-1"
                      title="Gunakan format resmi: Menindaklanjuti Surat dari... Nomor..."
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Format Standar Dinas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubstansi(buildNotulenKinerjaSubstanceTemplate(agenda))}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-medium transition-colors"
                      title="Format Notulen Rapat Internal Kinerja"
                    >
                      <span>Format Notulen</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Format otomatis diawali: <em>Menindaklanjuti Surat dari {agenda.sender}, Nomor {agenda.letterNumber}, bersama ini...</em>
                </p>
                <textarea
                  rows={14}
                  value={substansi}
                  onChange={(e) => setSubstansi(e.target.value)}
                  placeholder="Ketik atau edit substansi nota dinas di sini..."
                  className="w-full p-3.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed text-slate-900"
                />
              </div>

              {/* Signatory Settings */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-xs text-slate-900 block">
                  Bagian Penandatangan / Pelapor
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-medium text-slate-600 block mb-1">Pilih Staf Pegawai:</label>
                    <select
                      value={selectedStaffId}
                      onChange={(e) => handleStaffChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} — {emp.role} {emp.nip ? `(NIP ${formatNip(emp.nip)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-slate-600 block mb-1">Tempat & Tanggal TTD:</label>
                    <input
                      type="text"
                      value={signLocationDate}
                      onChange={(e) => setSignLocationDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-600 block mb-1">Nama Penandatangan:</label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-600 block mb-1">NIP Penandatangan:</label>
                    <input
                      type="text"
                      value={signerNip}
                      onChange={(e) => setSignerNip(formatNip(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-include-photos"
                    checked={includePhotos}
                    onChange={(e) => setIncludePhotos(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="chk-include-photos" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Sertakan Halaman Dokumentasi Foto Kegiatan (Halaman 2 sesuai referensi)
                  </label>
                </div>
              </div>

              {/* Bottom Actions in Editor */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Tampilkan di Pratinjau Kertas A4</span>
                </button>
              </div>
            </div>
          ) : (
            /* PREVIEW PAPER CONTAINER (A4 FORMAT) */
            <div className="max-w-[820px] mx-auto space-y-6">
              {/* PAGE 1: NASKAH DINAS BER-KOP RESMI */}
              <div
                id="printable-nota-dinas"
                className="bg-white rounded-xl shadow-md border border-slate-300 p-8 sm:p-12 text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none min-h-[1100px] flex flex-col justify-between"
                style={{ fontFamily: 'Bookman Old Style, Times New Roman, serif' }}
              >
                {/* 1. KOP SURAT RESMI */}
                <div>
                  <OfficialKopDinas />

                  {/* 2. JUDUL DOKUMEN */}
                  <div className="text-center mt-6 mb-5">
                    <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase text-slate-950 underline decoration-slate-950 underline-offset-4 font-sans">
                      {customTitle}
                    </h2>
                    {docType === 'NOTA_DINAS' && (
                      <p className="text-xs sm:text-sm text-slate-800 mt-1 font-mono">
                        Nomor : {nomorNota || '000.1.2/       /113.4/2026'}
                      </p>
                    )}
                  </div>

                  {/* 3. KEPALA NOTA DINAS (Format NOTA DINAS) */}
                  {docType === 'NOTA_DINAS' && (
                    <div className="mb-5 pb-3 border-b border-black text-xs sm:text-sm font-sans leading-relaxed">
                      <div className="grid grid-cols-[100px_16px_1fr] sm:grid-cols-[120px_16px_1fr] gap-y-1">
                        <span className="font-semibold text-slate-800">Yth.</span>
                        <span>:</span>
                        <span className="font-medium text-slate-950">{kepada}</span>

                        <span className="font-semibold text-slate-800">Dari</span>
                        <span>:</span>
                        <span className="font-medium text-slate-950">{dari}</span>

                        <span className="font-semibold text-slate-800">Tanggal</span>
                        <span>:</span>
                        <span className="font-medium text-slate-950">{tanggalNota}</span>

                        <span className="font-semibold text-slate-800">Sifat</span>
                        <span>:</span>
                        <span className="font-medium text-slate-950">{sifat}</span>

                        <span className="font-semibold text-slate-800">Lampiran</span>
                        <span>:</span>
                        <span className="font-medium text-slate-950">{lampiran}</span>

                        <span className="font-semibold text-slate-800">Hal</span>
                        <span>:</span>
                        <span className="font-bold text-slate-950">{hal}</span>
                      </div>
                    </div>
                  )}

                  {/* 4. SUBSTANSI ISI DOKUMEN */}
                  <div className="text-xs sm:text-[13px] leading-relaxed text-slate-900 whitespace-pre-wrap font-sans text-justify space-y-2">
                    {substansi}
                  </div>
                </div>

                {/* 5. BAGIAN PENANDATANGAN (KAKI DOKUMEN) */}
                <div className="mt-8 pt-4 flex justify-end page-break-avoid font-sans">
                  <div className="w-64 sm:w-72 text-center text-xs sm:text-[13px]">
                    <p className="text-slate-800">{signLocationDate}</p>
                    <p className="font-semibold text-slate-900 mt-1">
                      Pelapor / Pembuat Naskah,
                    </p>

                    {/* Paraf / Tanda Tangan Digital Stamp Space */}
                    <div className="h-16 flex items-center justify-center my-1">
                      <div className="border border-dashed border-slate-300 rounded px-3 py-1 bg-slate-50/50 text-[10px] text-slate-400 font-mono select-none">
                        [Tanda Tangan Pegawai]
                      </div>
                    </div>

                    <p className="font-bold text-slate-950 underline underline-offset-2 uppercase">
                      {signerName}
                    </p>
                    <p className="text-slate-800 font-mono text-[11px] sm:text-xs">
                      NIP {formatNip(signerNip)}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                      {signerRole}
                    </p>
                  </div>
                </div>
              </div>

              {/* PAGE 2: LAMPIRAN FOTO DOKUMENTASI (Sesuai Referensi PDF Halaman 2) */}
              {includePhotos && photos.length > 0 && (
                <div
                  className="bg-white rounded-xl shadow-md border border-slate-300 p-8 sm:p-12 text-slate-900 page-break-before print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none min-h-[1100px] flex flex-col justify-start"
                  style={{ fontFamily: 'Bookman Old Style, Times New Roman, serif' }}
                >
                  {/* Judul Lampiran Dokumentasi */}
                  <div className="text-center mb-8">
                    <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 font-sans">
                      Dokumentasi Pelaksanaan Kegiatan
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5 font-sans">
                      {agenda.subject}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 font-sans">
                      Tanggal {tanggalNota}
                    </p>
                    <div className="w-24 h-0.5 bg-slate-300 mx-auto mt-2" />
                  </div>

                  {/* Grid Foto Dokumentasi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {photos.map((photo, idx) => (
                      <div
                        key={photo.id || idx}
                        className="border border-slate-300 rounded-lg p-2 bg-slate-50/40 page-break-avoid flex flex-col items-center"
                      >
                        <div className="w-full aspect-[4/3] rounded overflow-hidden bg-slate-200 border border-slate-200">
                          <img
                            src={photo.url}
                            alt={photo.caption || `Dokumentasi ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-800 font-sans font-medium text-center mt-2 px-2 leading-snug">
                          {photo.caption || `Foto Kegiatan ${idx + 1}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer - Hidden during print */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Kop Resmi: Dinas Perhubungan Pemprov Jatim (Jalan Ahmad Yani 268 Surabaya)</span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'preview' ? (
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200 flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sesuaikan Substansi</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200 flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lihat Pratinjau Kertas A4</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Ekspor PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
