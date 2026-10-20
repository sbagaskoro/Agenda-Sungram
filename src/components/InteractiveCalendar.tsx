import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Inbox, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Filter,
  UserCheck,
  Building2,
  FileText,
  AlertCircle,
  Eye,
  Maximize2,
  LayoutGrid
} from 'lucide-react';
import { AgendaItem, Employee } from '../types';

interface InteractiveCalendarProps {
  agendas: AgendaItem[];
  employees?: Employee[];
  onDateClick: (dateStr: string) => void;
  onAgendaClick: (agenda: AgendaItem) => void;
  selectedDateFilter: string | null;
  onSelectDateFilter: (dateStr: string | null) => void;
  viewMode?: 'all' | 'calendar-only' | 'kanban-only';
  onViewModeChange?: (mode: 'all' | 'calendar-only' | 'kanban-only') => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_NAMES_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  agendas,
  employees = [],
  onDateClick,
  onAgendaClick,
  selectedDateFilter,
  onSelectDateFilter,
  viewMode = 'all',
  onViewModeChange,
}) => {
  // Current calendar view month (strictly realtime current date)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Hover state for interactive popup
  const [hoveredCellDate, setHoveredCellDate] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // Calendar math (Monday as start of week)
  const firstDayOfMonth = new Date(year, month, 1);
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Dynamic row calculation: Only 5 rows (35 cells) if it fits in 5 weeks, or 6 rows (42 cells) if needed
  const totalCellsNeeded = startingDayOfWeek + daysInMonth;
  const targetTotalCells = totalCellsNeeded <= 35 ? 35 : 42;
  const totalRows = targetTotalCells / 7;

  // Generate calendar cells
  const calendarCells: Array<{
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    colIndex: number;
    rowIndex: number;
  }> = [];

  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const prevMStr = String(prevDate.getMonth() + 1).padStart(2, '0');
    const prevDStr = String(dayNum).padStart(2, '0');
    const dateStr = `${prevDate.getFullYear()}-${prevMStr}-${prevDStr}`;
    const cellIdx = calendarCells.length;
    calendarCells.push({
      dateStr,
      dayNum,
      isCurrentMonth: false,
      colIndex: cellIdx % 7,
      rowIndex: Math.floor(cellIdx / 7),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    const cellIdx = calendarCells.length;
    calendarCells.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: true,
      colIndex: cellIdx % 7,
      rowIndex: Math.floor(cellIdx / 7),
    });
  }

  // Next month leading days to complete dynamic targetTotalCells (35 or 42)
  const remainingCells = targetTotalCells - calendarCells.length;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonthDate = new Date(year, month + 1, day);
    const nextMonthVal = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const nextDayVal = String(day).padStart(2, '0');
    const dateStr = `${nextMonthDate.getFullYear()}-${nextMonthVal}-${nextDayVal}`;
    const cellIdx = calendarCells.length;
    calendarCells.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: false,
      colIndex: cellIdx % 7,
      rowIndex: Math.floor(cellIdx / 7),
    });
  }

  // Group agendas by date
  const agendasByDate: Record<string, AgendaItem[]> = {};
  for (const item of agendas) {
    if (!agendasByDate[item.eventDate]) {
      agendasByDate[item.eventDate] = [];
    }
    agendasByDate[item.eventDate].push(item);
  }

  // Real-time current day in YYYY-MM-DD
  const realNow = new Date();
  const realYear = realNow.getFullYear();
  const realMonth = String(realNow.getMonth() + 1).padStart(2, '0');
  const realDay = String(realNow.getDate()).padStart(2, '0');
  const todayStr = `${realYear}-${realMonth}-${realDay}`;

  // Helper to format full Indonesian date
  const formatIndoDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayName = DAY_NAMES_FULL[dateObj.getDay()];
      const monthName = MONTH_NAMES[m - 1];
      return `${dayName}, ${d} ${monthName} ${y}`;
    } catch {
      return dateStr;
    }
  };

  // Helper to get employee name by id
  const getEmployeeName = (empId: string): string => {
    const found = employees.find((e) => e.id === empId);
    return found ? found.name : empId;
  };

  const handleMouseEnterCell = (dateStr: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredCellDate(dateStr);
  };

  const handleMouseLeaveCell = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCellDate(null);
    }, 150);
  };

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-sm mb-4">
      {/* Calendar Header Bar - Streamlined & Compact */}
      <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-gradient-to-r from-slate-50/80 via-white to-blue-50/30 rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {MONTH_NAMES[month]} {year}
              </h2>
              {month === realNow.getMonth() && year === realNow.getFullYear() && (
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  Hari Ini: {realDay} {MONTH_NAMES[realNow.getMonth()]} {realYear}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Hover ke tanggal untuk melihat popup agenda & disposisi. Klik tanggal untuk menambah agenda.
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Navigation Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {onViewModeChange && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-[11px] font-medium text-slate-600 mr-1">
              <button
                type="button"
                onClick={() => onViewModeChange('calendar-only')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'calendar-only'
                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                    : 'hover:text-slate-900'
                }`}
                title="Tampilkan kalender saja agar fit to screen tanpa scroll"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden md:inline">Kalender Layar Penuh</span>
                <span className="md:hidden">Kalender</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'all'
                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                    : 'hover:text-slate-900'
                }`}
                title="Tampilkan Kalender dan Papan Kanban Planner"
              >
                <LayoutGrid className="w-3 h-3" />
                <span className="hidden md:inline">Semua Tampilan</span>
                <span className="md:hidden">Semua</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
            title={`Kembali ke hari ini (${realDay} ${MONTH_NAMES[realNow.getMonth()]} ${realYear})`}
          >
            Hari Ini
          </button>
          <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 text-slate-600 transition-colors border-r border-slate-200 cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels Header - Compact */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/90 text-center text-[11px] font-bold text-slate-600 py-1.5">
        {DAY_NAMES_SHORT.map((d, index) => (
          <div key={d} className={index >= 5 ? 'text-rose-600 font-semibold' : ''}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Fit to Screen Height (5 or 6 rows) */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 border-b border-slate-200 relative">
        {calendarCells.map((cell, idx) => {
          const dayAgendas = agendasByDate[cell.dateStr] || [];
          const isToday = cell.dateStr === todayStr;
          const isSelected = selectedDateFilter === cell.dateStr;
          const isHovered = hoveredCellDate === cell.dateStr;

          // Check if any agenda on this day is in Planner B (Terdisposisi)
          const countDisposisi = dayAgendas.filter((a) => a.stage === 'In_Progress').length;
          const countReceived = dayAgendas.filter((a) => a.stage === 'Received').length;
          const countCompleted = dayAgendas.filter((a) => a.stage === 'Completed').length;

          // Popup placement: avoid screen boundaries
          // Col 0,1,2 -> anchor left; Col 3 -> center/left; Col 4,5,6 -> anchor right
          // Row >= 2 -> anchor bottom (float up); Row < 2 -> anchor top (float down)
          const isNearRightEdge = cell.colIndex >= 4;
          const isCenter = cell.colIndex === 3;
          const isBottomRows = cell.rowIndex >= (totalRows >= 6 ? 3 : 2);

          return (
            <div
              key={`${cell.dateStr}-${idx}`}
              onMouseEnter={() => handleMouseEnterCell(cell.dateStr)}
              onMouseLeave={handleMouseLeaveCell}
              onClick={() => onDateClick(cell.dateStr)}
              className={`h-[56px] sm:h-[64px] lg:h-[70px] p-1 sm:p-1.5 transition-all group relative cursor-pointer flex flex-col justify-between ${
                !cell.isCurrentMonth
                  ? 'bg-slate-50/50 text-slate-300'
                  : isSelected
                  ? 'bg-blue-50/90 ring-2 ring-blue-600 ring-inset z-20 shadow-xs'
                  : isToday
                  ? 'bg-blue-50/40 ring-2 ring-blue-400/80 ring-inset z-10'
                  : 'bg-white hover:bg-blue-50/25'
              }`}
            >
              {/* Top Row: Date Number and Quick Indicators */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-xs font-black ring-2 ring-blue-200'
                      : !cell.isCurrentMonth
                      ? 'text-slate-300'
                      : 'text-slate-700 group-hover:text-blue-600'
                  }`}
                >
                  {cell.dayNum}
                </span>

                {/* Status Badges or Indicators */}
                <div className="flex items-center gap-1">
                  {dayAgendas.length > 0 && (
                    <div className="flex items-center gap-0.5">
                      {countDisposisi > 0 && (
                        <span
                          className="w-2 h-2 rounded-full bg-indigo-600 shadow-2xs"
                          title={`${countDisposisi} Agenda Terdisposisi (Planner B)`}
                        />
                      )}
                      {countReceived > 0 && (
                        <span
                          className="w-2 h-2 rounded-full bg-amber-500 shadow-2xs"
                          title={`${countReceived} Agenda Baru (Planner A)`}
                        />
                      )}
                      {countCompleted > 0 && (
                        <span
                          className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs"
                          title={`${countCompleted} Agenda Selesai (Planner C)`}
                        />
                      )}
                      <span className="text-[10px] font-bold text-slate-600 ml-0.5 hidden sm:inline">
                        {dayAgendas.length}
                      </span>
                    </div>
                  )}

                  {/* Hover Quick Filter */}
                  {dayAgendas.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDateFilter(isSelected ? null : cell.dateStr);
                      }}
                      className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'
                      }`}
                      title={isSelected ? 'Hapus filter tanggal' : 'Filter kartu ke tanggal ini'}
                    >
                      <Filter className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom: Compact 1-line item preview */}
              <div className="mt-0.5 overflow-hidden">
                {dayAgendas.length > 0 ? (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onAgendaClick(dayAgendas[0]);
                    }}
                    className={`text-[9.5px] sm:text-[10px] px-1 py-0.5 rounded font-medium truncate flex items-center gap-1 border transition-colors ${
                      dayAgendas[0].stage === 'In_Progress'
                        ? 'bg-indigo-50 text-indigo-900 border-indigo-200/90 font-semibold'
                        : dayAgendas[0].stage === 'Completed'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200/90 font-semibold'
                        : 'bg-amber-50 text-amber-900 border-amber-200/90'
                    }`}
                    title={`${dayAgendas[0].startTime || '09:00'} ${dayAgendas[0].subject}`}
                  >
                    <span className="font-bold shrink-0">{dayAgendas[0].startTime || '09:00'}</span>
                    <span className="truncate">{dayAgendas[0].subject}</span>
                    {dayAgendas.length > 1 && (
                      <span className="ml-auto text-[8.5px] font-bold px-1 rounded bg-white/80 shrink-0 text-slate-700">
                        +{dayAgendas.length - 1}
                      </span>
                    )}
                  </div>
                ) : cell.isCurrentMonth ? (
                  <div className="opacity-0 group-hover:opacity-60 text-[9px] text-slate-400 flex items-center justify-center gap-0.5">
                    <Plus className="w-2.5 h-2.5" />
                    <span>Agenda</span>
                  </div>
                ) : null}
              </div>

              {/* ============================================================== */}
              {/* HOVER POPUP: KESELURUHAN AGENDA & DETAIL DISPOSISI (Clean & Informatif) */}
              {/* ============================================================== */}
              {isHovered && (
                <div
                  onMouseEnter={() => handleMouseEnterCell(cell.dateStr)}
                  onMouseLeave={handleMouseLeaveCell}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute z-50 w-[330px] sm:w-[390px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-0 text-slate-800 transition-all pointer-events-auto animate-in fade-in zoom-in-95 duration-150 ${
                    isNearRightEdge
                      ? 'right-0'
                      : isCenter
                      ? 'left-1/2 -translate-x-1/2'
                      : 'left-0'
                  } ${
                    isBottomRows
                      ? 'bottom-[calc(100%+8px)]'
                      : 'top-[calc(100%+8px)]'
                  }`}
                  style={{ filter: 'drop-shadow(0 15px 25px rgba(15, 23, 42, 0.18))' }}
                >
                  {/* Popup Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-2xl flex items-center justify-between border-b border-slate-700/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold capitalize">
                          {formatIndoDate(cell.dateStr)}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-extrabold uppercase bg-blue-500 text-white px-2 py-0.5 rounded-full tracking-wider">
                            Hari Ini
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {dayAgendas.length > 0
                          ? `${dayAgendas.length} agenda kegiatan tercatat`
                          : 'Belum ada agenda kegiatan'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDateClick(cell.dateStr)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors shrink-0"
                      title="Tambah agenda baru pada tanggal ini"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah</span>
                    </button>
                  </div>

                  {/* Popup Agenda List */}
                  {dayAgendas.length > 0 ? (
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 p-1">
                      {dayAgendas.map((item) => {
                        const isDisposisi = item.stage === 'In_Progress';
                        const isCompleted = item.stage === 'Completed';

                        // Assigned staff names
                        const assignedIds = item.disposition?.assignedEmployeeIds || [];
                        const assignedNames = assignedIds
                          .map((id) => getEmployeeName(id))
                          .join(', ');

                        return (
                          <div
                            key={item.id}
                            onClick={() => onAgendaClick(item)}
                            className="p-3 hover:bg-slate-50/90 rounded-xl transition-colors cursor-pointer group/item"
                          >
                            {/* Status Disposisi Badge */}
                            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                              {isDisposisi ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs">
                                  <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                                  <span>TERDISPOSISI (Planner B)</span>
                                </span>
                              ) : isCompleted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-2xs">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>SELESAI & ADA LAPORAN (Planner C)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs">
                                  <Inbox className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>MENUNGGU DISPOSISI (Planner A)</span>
                                </span>
                              )}

                              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                {item.startTime || '09:00'} - {item.endTime || 'Selesai'} WIB
                              </span>
                            </div>

                            {/* Judul Agenda / Perihal */}
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover/item:text-blue-600 leading-snug">
                              {item.subject}
                            </h4>

                            {/* Lokasi / Ruangan */}
                            <div className="mt-1 flex items-start gap-1.5 text-[11px] text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span className="font-medium text-slate-700 line-clamp-2">
                                {item.location || 'Tempat belum ditentukan'}
                              </span>
                            </div>

                            {/* Detail Disposisi Spesifik (Jika Terdisposisi) */}
                            {isDisposisi && (
                              <div className="mt-2 p-2 rounded-lg bg-indigo-50/70 border border-indigo-100/90 text-[11px]">
                                <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                                  <UserCheck className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                                  <span>Petugas Disposisi:</span>
                                </div>
                                <p className="text-indigo-900 font-semibold pl-5 mt-0.5">
                                  {assignedNames || 'Staf Subbag Sungram'}
                                </p>
                                {item.disposition?.disposerNote && (
                                  <div className="mt-1 pl-5 text-[10.5px] text-slate-600 italic">
                                    &ldquo;{item.disposition.disposerNote}&rdquo;
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Detail Laporan (Jika Selesai) */}
                            {isCompleted && item.report && (
                              <div className="mt-2 p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-[11px]">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                  <span>Laporan Dituntaskan Oleh:</span>
                                </div>
                                <p className="text-emerald-900 font-semibold pl-5 mt-0.5">
                                  {item.report.reportedByName}
                                </p>
                              </div>
                            )}

                            {/* Asal Surat & Nomor */}
                            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-1">
                              <div className="flex items-center gap-1 truncate max-w-[220px]">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{item.sender}</span>
                              </div>
                              <span className="text-slate-400 font-mono">
                                No: {item.letterNumber}
                              </span>
                            </div>

                            {/* Hint Klik */}
                            <div className="mt-1 text-right text-[10px] text-blue-600 font-semibold flex items-center justify-end gap-1 group-hover/item:underline">
                              <Eye className="w-3 h-3" />
                              <span>Klik untuk buka lembar disposisi</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-xs text-slate-500">
                        Tidak ada surat atau agenda pada tanggal ini.
                      </p>
                      <button
                        type="button"
                        onClick={() => onDateClick(cell.dateStr)}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Klik untuk jadwalkan agenda surat baru</span>
                      </button>
                    </div>
                  )}

                  {/* Popup Footer Note */}
                  <div className="px-3.5 py-2 bg-slate-50 rounded-b-2xl border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>💡 Klik pada agenda untuk membuka detail</span>
                    {dayAgendas.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onSelectDateFilter(isSelected ? null : cell.dateStr)}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        {isSelected ? 'Hapus Filter' : 'Filter Kanban'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendar Footer Legend - Compact */}
      <div className="px-4 py-2 bg-slate-50/80 rounded-b-2xl border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-3.5 flex-wrap">
          <span className="font-semibold text-slate-500 text-[11px]">Keterangan:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[11px]">Planner A: Surat Masuk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span className="text-[11px] font-semibold text-indigo-900">Planner B: Terdisposisi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="text-[11px]">Planner C: Selesai</span>
          </div>
        </div>

        <p className="text-[10.5px] text-slate-500 italic hidden sm:block">
          Arahkan kursor (hover) ke kotak tanggal untuk menampilkan popup seluruh agenda
        </p>
      </div>
    </div>
  );
};
