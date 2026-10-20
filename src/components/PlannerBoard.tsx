import React, { useState } from 'react';
import { 
  Inbox, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  Send, 
  FileText, 
  Trash2, 
  Edit3, 
  Eye, 
  Calendar, 
  MapPin, 
  Building, 
  AlertCircle,
  GripVertical,
  ShieldCheck,
  Paperclip,
  Check,
  HardDrive
} from 'lucide-react';
import { AgendaItem, Employee, PlannerStage } from '../types';

interface PlannerBoardProps {
  agendas: AgendaItem[];
  employees: Employee[];
  selectedDateFilter: string | null;
  onClearDateFilter: () => void;
  onViewDetail: (agenda: AgendaItem) => void;
  onEditAgenda: (agenda: AgendaItem) => void;
  onDeleteAgenda: (id: string) => void;
  onRequestDisposition: (agenda: AgendaItem) => void;
  onRequestReport: (agenda: AgendaItem) => void;
  onMoveStageDirectly: (agendaId: string, targetStage: PlannerStage) => void;
  onOpenNotaDinas?: (agenda: AgendaItem) => void;
}

export const PlannerBoard: React.FC<PlannerBoardProps> = ({
  agendas,
  employees,
  selectedDateFilter,
  onClearDateFilter,
  onViewDetail,
  onEditAgenda,
  onDeleteAgenda,
  onRequestDisposition,
  onRequestReport,
  onMoveStageDirectly,
  onOpenNotaDinas,
}) => {
  const [draggedAgendaId, setDraggedAgendaId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PlannerStage | null>(null);
  const [itemToDelete, setItemToDelete] = useState<AgendaItem | null>(null);

  // Filter agendas if date filter is active
  const filteredAgendas = selectedDateFilter
    ? agendas.filter((a) => a.eventDate === selectedDateFilter)
    : agendas;

  const getAgendasByStage = (stage: PlannerStage) =>
    filteredAgendas.filter((a) => a.stage === stage);

  const getStaff = (id: string) => employees.find((e) => e.id === id);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedAgendaId(id);
  };

  const handleDragOver = (e: React.DragEvent, stage: PlannerStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: PlannerStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const id = e.dataTransfer.getData('text/plain') || draggedAgendaId;
    if (!id) return;

    const item = agendas.find((a) => a.id === id);
    if (!item) return;

    // Check workflow validation
    if (item.stage === targetStage) return;

    if (item.stage === 'Received' && targetStage === 'In_Progress') {
      // Must fulfill: Tagging Staf & Catatan Kasubbag
      onRequestDisposition(item);
    } else if (item.stage === 'In_Progress' && targetStage === 'Completed') {
      // Must fulfill: Laporan Disposisi Staf
      onRequestReport(item);
    } else if (item.stage === 'Received' && targetStage === 'Completed') {
      // Must complete stage B first
      onRequestDisposition(item);
    } else {
      // Moving backwards (e.g. Completed -> In_Progress or In_Progress -> Received)
      onMoveStageDirectly(item.id, targetStage);
    }

    setDraggedAgendaId(null);
  };

  const urgencyBadgeColor: Record<string, string> = {
    Biasa: 'bg-slate-100 text-slate-700 border-slate-200',
    Segera: 'bg-amber-100 text-amber-800 border-amber-300',
    'Sangat Segera': 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    Rahasia: 'bg-purple-100 text-purple-800 border-purple-300',
  };

  return (
    <section className="mb-10">
      {/* Board Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Papan Alur Planner 3 Tahap</span>
            {selectedDateFilter && (
              <span className="text-xs px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
                Filter: {selectedDateFilter}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500">
            Alur otomatis: A (Surat Masuk) &rarr; B (Disposisi Kasubbag & Staf) &rarr; C (Laporan Selesai)
          </p>
        </div>

        {selectedDateFilter && (
          <button
            type="button"
            onClick={onClearDateFilter}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline self-start sm:self-auto"
          >
            Tampilkan Semua Agenda
          </button>
        )}
      </div>

      {/* 3 Kanban Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ========================================================= */}
        {/* PLANNER A: RECEIVED (Surat Masuk Diterima) */}
        {/* ========================================================= */}
        <div
          onDragOver={(e) => handleDragOver(e, 'Received')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'Received')}
          className={`bg-slate-100/70 border rounded-2xl p-3.5 sm:p-4 flex flex-col transition-all min-h-[480px] ${
            dragOverStage === 'Received'
              ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-400/40'
              : 'border-slate-200'
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Planner A: Surat Masuk</span>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-200 text-amber-900 rounded-full">
                    {getAgendasByStage('Received').length}
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500">Diterima & siap didisposisikan</p>
              </div>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            {getAgendasByStage('Received').length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-white/50 text-slate-400 text-xs">
                <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">Tidak ada surat masuk di tahap ini</p>
                <p className="text-[11px] mt-1">
                  Klik tanggal pada kalender di atas untuk menambahkan surat masuk baru.
                </p>
              </div>
            ) : (
              getAgendasByStage('Received').map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onClick={() => onViewDetail(item)}
                  className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all cursor-grab active:cursor-grabbing group space-y-2.5"
                >
                  {/* Card Header: Letter Number & Urgency */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 shrink-0 transition-colors" />
                      <span className="font-mono text-[11px] font-bold text-slate-700 truncate">
                        {item.letterNumber}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                        urgencyBadgeColor[item.urgency] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.urgency}
                    </span>
                  </div>

                  {/* Subject & Sender */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
                      {item.subject}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1 truncate flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{item.sender}</span>
                    </p>
                  </div>

                  {/* Execution Date & Time */}
                  <div className="p-2 bg-amber-50/60 border border-amber-100 rounded-lg text-[11px] text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>{item.eventDate} ({item.startTime} - {item.endTime})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-800 text-[10px]">
                      <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  </div>

                  {item.driveFileId && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-medium">
                      <HardDrive className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">Drive: {item.driveFolderPath}</span>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail(item);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title="Lihat Detail Surat"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAgenda(item);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit Data Surat & Agenda"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Hapus Agenda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Step Advance Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDisposition(item);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>Disposisikan &rarr;</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* PLANNER B: IN_PROGRESS (Disposisi & Proses Staf) */}
        {/* ========================================================= */}
        <div
          onDragOver={(e) => handleDragOver(e, 'In_Progress')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'In_Progress')}
          className={`bg-slate-100/70 border rounded-2xl p-3.5 sm:p-4 flex flex-col transition-all min-h-[480px] ${
            dragOverStage === 'In_Progress'
              ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-400/40'
              : 'border-slate-200'
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Planner B: Disposisi & Proses</span>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-200 text-indigo-900 rounded-full">
                    {getAgendasByStage('In_Progress').length}
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500">Didisposisikan & sedang diproses staf</p>
              </div>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            {getAgendasByStage('In_Progress').length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-white/50 text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">Belum ada agenda yang didisposisikan</p>
                <p className="text-[11px] mt-1">
                  Geser kartu dari Planner A atau klik "Disposisikan" untuk menugaskan staf.
                </p>
              </div>
            ) : (
              getAgendasByStage('In_Progress').map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onClick={() => onViewDetail(item)}
                  className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing group space-y-2.5"
                >
                  {/* Card Header: Letter Number & Priority */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 shrink-0 transition-colors" />
                      <span className="font-mono text-[11px] font-bold text-slate-700 truncate">
                        {item.letterNumber}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {item.disposition?.priority || 'Penting'}
                    </span>
                  </div>

                  {/* Subject & Sender */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
                      {item.subject}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1 truncate flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{item.sender}</span>
                    </p>
                  </div>

                  {/* Catatan Pendisposisi: Kasubbag Sungram */}
                  {item.disposition && (
                    <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg space-y-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-900">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Arahan Kasubbag Sungram ({item.disposition.disposerName}):</span>
                      </div>
                      <p className="text-[11px] text-slate-700 line-clamp-2 italic leading-relaxed">
                        "{item.disposition.disposerNote}"
                      </p>

                      {/* Tagged Staff Chips */}
                      <div className="pt-1.5 border-t border-indigo-100/80 flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-indigo-800 font-semibold">Staf Ditugaskan:</span>
                        {item.disposition.assignedEmployeeIds?.map((empId) => {
                          const emp = getStaff(empId);
                          return (
                            <span
                              key={empId}
                              className="text-[9px] px-1.5 py-0.5 bg-white border border-indigo-200 text-indigo-900 rounded font-medium truncate max-w-[130px]"
                              title={emp?.name}
                            >
                              {emp?.name.split(' ')[0] || 'Staf'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Execution Time */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{item.eventDate} ({item.startTime})</span>
                    </span>
                    <span className="truncate max-w-[130px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.location}</span>
                    </span>
                  </div>

                  {item.driveFileId && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-medium">
                      <HardDrive className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">Drive: {item.driveFolderPath}</span>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail(item);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title="Lihat Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDisposition(item);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Ubah Disposisi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Hapus Agenda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Step Advance Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestReport(item);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Isi Laporan &rarr;</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* PLANNER C: COMPLETED (Selesai & Laporan Terisi) */}
        {/* ========================================================= */}
        <div
          onDragOver={(e) => handleDragOver(e, 'Completed')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'Completed')}
          className={`bg-slate-100/70 border rounded-2xl p-3.5 sm:p-4 flex flex-col transition-all min-h-[480px] ${
            dragOverStage === 'Completed'
              ? 'border-emerald-400 bg-emerald-50/50 ring-2 ring-emerald-400/40'
              : 'border-slate-200'
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Planner C: Selesai</span>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-200 text-emerald-900 rounded-full">
                    {getAgendasByStage('Completed').length}
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500">Tuntas & laporan disposisi tersimpan</p>
              </div>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            {getAgendasByStage('Completed').length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-white/50 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">Belum ada agenda yang diselesaikan</p>
                <p className="text-[11px] mt-1">
                  Staf terdisposisi dapat mengisi laporan dari Planner B untuk menyelesaikan agenda.
                </p>
              </div>
            ) : (
              getAgendasByStage('Completed').map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onClick={() => onViewDetail(item)}
                  className="p-3.5 bg-white rounded-xl border border-emerald-200/90 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all cursor-grab active:cursor-grabbing group space-y-2.5"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 shrink-0 transition-colors" />
                      <span className="font-mono text-[11px] font-bold text-slate-700 truncate">
                        {item.letterNumber}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Tuntas</span>
                    </span>
                  </div>

                  {/* Subject & Sender */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      {item.subject}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1 truncate flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{item.sender}</span>
                    </p>
                  </div>

                  {/* Laporan Disposisi Snippet */}
                  {item.report && (
                    <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between gap-1 text-[10px] text-emerald-900">
                        <span className="font-bold">Pelapor: {item.report.reportedByName}</span>
                        {item.report.photos && item.report.photos.length > 0 && (
                          <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                            📷 {item.report.photos.length} Foto
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-700 line-clamp-2 leading-relaxed">
                        {item.report.executionNotes}
                      </p>
                    </div>
                  )}

                  {/* Execution Date & Location */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{item.eventDate} ({item.startTime})</span>
                    </span>
                    <span className="truncate max-w-[130px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.location}</span>
                    </span>
                  </div>

                  {item.driveFileId && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-medium">
                      <HardDrive className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">Drive: {item.driveFolderPath}</span>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestReport(item);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Edit Laporan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Hapus Agenda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenNotaDinas) {
                            onOpenNotaDinas(item);
                          } else {
                            onViewDetail(item);
                          }
                        }}
                        className="px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                        title="Buka / Cetak format resmi Nota Dinas ber-Kop Pemprov Jatim"
                      >
                        <FileText className="w-3 h-3 text-indigo-600" />
                        <span>Nota Dinas</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail(item);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Detail</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Deleting Agenda */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            id="modal-confirm-delete"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              Konfirmasi Hapus Agenda & Surat Masuk
            </h3>
            <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus agenda{' '}
              <span className="font-bold text-slate-800">"{itemToDelete.subject}"</span>?
            </p>
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <p className="font-mono text-slate-800">
                Nomor: <strong className="font-bold">{itemToDelete.letterNumber}</strong>
              </p>
              <p>Pengirim: {itemToDelete.sender}</p>
              <p>Jadwal: {itemToDelete.eventDate} ({itemToDelete.startTime})</p>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-delete-action"
                onClick={() => {
                  onDeleteAgenda(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Agenda</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
