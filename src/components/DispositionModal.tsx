import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Send, 
  AlertCircle, 
  Check, 
  Building, 
  Calendar, 
  Clock, 
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { AgendaItem, Employee, AgendaDisposition } from '../types';
import { DISPOSITION_HEAD } from '../data/initialData';
import { formatNip } from '../utils/nameFormatter';

interface DispositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  agenda: AgendaItem | null;
  employees: Employee[];
  onSaveDisposition: (agendaId: string, dispositionData: AgendaDisposition) => void;
}

const QUICK_INSTRUCTIONS = [
  'Pelajari dokumen, hadiri rapat, dan buat laporan tertulis hasil pembahasan.',
  'Siapkan bahan paparan serta matriks serapan anggaran Subbag Sungram.',
  'Tindak lanjuti segera dan koordinasikan teknis pelaksanaan bersama tim.',
  'Verifikasi kesesuaian pagu indikatif DIPA dan laporkan progresnya.',
  'Dampingi tim pemeriksa dan siapkan data dukung evaluasi program kerja.',
];

export const DispositionModal: React.FC<DispositionModalProps> = ({
  isOpen,
  onClose,
  agenda,
  employees,
  onSaveDisposition,
}) => {
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [disposerNote, setDisposerNote] = useState('');
  const [priority, setPriority] = useState<'Biasa' | 'Penting' | 'Mendesak'>('Penting');
  const [errorMsg, setErrorMsg] = useState('');

  // Filter out head from assignable staff list
  const staffList = employees.filter((e) => e.id !== DISPOSITION_HEAD.id);

  useEffect(() => {
    if (agenda) {
      if (agenda.disposition) {
        setSelectedStaffIds(agenda.disposition.assignedEmployeeIds || []);
        setDisposerNote(agenda.disposition.disposerNote || '');
        setPriority(agenda.disposition.priority || 'Penting');
      } else {
        setSelectedStaffIds([]);
        setDisposerNote('Pelajari substansi dokumen, hadiri rapat, dan buat laporan tertulis hasil pembahasan.');
        setPriority('Penting');
      }
      setErrorMsg('');
    }
  }, [agenda, isOpen]);

  if (!isOpen || !agenda) return null;

  const toggleStaff = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedStaffIds(staffList.map((s) => s.id));
  };

  const handleClearAll = () => {
    setSelectedStaffIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStaffIds.length === 0) {
      setErrorMsg('Pilih minimal 1 staf yang terdisposisi (Tahap 1).');
      return;
    }

    if (!disposerNote.trim()) {
      setErrorMsg('Catatan dari pendisposisi wajib diisi (Tahap 2).');
      return;
    }

    onSaveDisposition(agenda.id, {
      assignedEmployeeIds: selectedStaffIds,
      disposerName: DISPOSITION_HEAD.name,
      disposerRole: 'Kepala Sub Bagian Penyusunan Program dan Anggaran',
      disposerNote: disposerNote.trim(),
      disposedAt: new Date().toISOString(),
      priority,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        id="modal-disposition"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Lembar Disposisi Surat Masuk
              </h3>
              <p className="text-xs text-indigo-100/80">
                Pindahkan ke Planner B (Disposisi/Proses): Tagging Staf & Catatan Kasubbag Sungram
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Agenda Summary Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-mono font-bold text-slate-800 text-[11px] bg-slate-200/70 px-2 py-0.5 rounded">
                No: {agenda.letterNumber}
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Pelaksanaan: {agenda.eventDate} ({agenda.startTime} - {agenda.endTime})</span>
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm leading-snug">
              {agenda.subject}
            </h4>
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Pengirim: {agenda.sender}</span>
            </div>
          </div>

          {/* Pendisposisi Profile Display */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                YV
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block">
                  Pendisposisi Resmi:
                </span>
                <p className="text-xs font-bold text-slate-900">
                  {DISPOSITION_HEAD.name}
                </p>
                <p className="text-[11px] text-slate-600">
                  Kepala Sub Bagian Penyusunan Program dan Anggaran
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Kasubbag Sungram</span>
              </span>
            </div>
          </div>

          {/* Syarat 2: Catatan dari Pendisposisi */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>2. Catatan / Arahan dari Pendisposisi</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500">Prioritas:</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="text-xs px-2 py-0.5 border border-slate-200 rounded-md bg-white font-medium"
                >
                  <option value="Biasa">Biasa</option>
                  <option value="Penting">Penting</option>
                  <option value="Mendesak">Mendesak</option>
                </select>
              </div>
            </div>

            <textarea
              rows={3}
              value={disposerNote}
              onChange={(e) => setDisposerNote(e.target.value)}
              placeholder="Ketik catatan atau arahan dari Kasubbag Sungram untuk staf yang terdisposisi..."
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />

            {/* Quick Suggestions */}
            <div className="mt-2 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Template arahan cepat Kasubbag:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_INSTRUCTIONS.map((instr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDisposerNote(instr)}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-lg text-slate-700 transition-colors text-left"
                  >
                    &bull; {instr.slice(0, 48)}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Syarat 1: Tagging Staf yang Terdisposisi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>1. Tagging Staf yang Terdisposisi</span>
                <span className="text-rose-500">*</span>
                <span className="ml-1 text-[11px] font-semibold px-2 py-0.2 bg-indigo-100 text-indigo-800 rounded-full">
                  {selectedStaffIds.length} staf dipilih
                </span>
              </label>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
              {staffList.map((emp) => {
                const isSelected = selectedStaffIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleStaff(emp.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg ${emp.avatarBg || 'bg-slate-600'} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}
                      >
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {emp.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {emp.role} {emp.nip ? `• NIP ${formatNip(emp.nip)}` : ''}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow Note */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-200/60 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600 shrink-0" />
            <p>
              Menyimpan disposisi ini akan langsung memindahkan kartu surat ke <strong>Planner B (Disposisi/Proses)</strong>.
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
              id="btn-save-disposition-progress"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simpan Disposisi & Geser ke Planner B</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
