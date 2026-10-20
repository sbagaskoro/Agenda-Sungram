import React from 'react';
import { LogoPemprovJatim } from './LogoPemprovJatim';

interface OfficialKopDinasProps {
  className?: string;
  subAgency?: string; // Optional: e.g. "SUB BAGIAN PENYUSUNAN PROGRAM DAN ANGGARAN"
  address?: string;
  phone?: string;
}

export const OfficialKopDinas: React.FC<OfficialKopDinasProps> = ({
  className = '',
  address = 'Jalan Ahmad Yani Nomor 268, Menanggal, Gayungan, Surabaya, Jawa Timur 60234',
  phone = 'Telepon (031) 8222276-8221530',
}) => {
  return (
    <div className={`w-full select-none ${className}`}>
      <div className="flex items-center justify-between gap-4 pb-2.5">
        {/* Logo Pemprov Jawa Timur di sebelah kiri */}
        <div className="shrink-0 flex items-center justify-center pl-1 sm:pl-2">
          <LogoPemprovJatim className="w-16 h-20 sm:w-20 sm:h-24 drop-shadow-xs" />
        </div>

        {/* Teks Kop Resmi Dinas Perhubungan Pemprov Jatim */}
        <div className="flex-1 text-center leading-tight">
          <h2 className="text-sm sm:text-base md:text-[17px] font-bold text-slate-900 tracking-wider uppercase font-sans">
            PEMERINTAH PROVINSI JAWA TIMUR
          </h2>
          <h1 className="text-base sm:text-lg md:text-[21px] font-extrabold text-slate-950 tracking-wide uppercase mt-0.5 font-sans">
            DINAS PERHUBUNGAN
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-800 mt-1 font-sans font-normal leading-snug">
            {address}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-800 font-sans font-normal">
            {phone}
          </p>
        </div>

        {/* Spacer kanan penyeimbang agar teks kop persis di tengah */}
        <div className="shrink-0 w-16 sm:w-20 hidden sm:block" aria-hidden="true" />
      </div>

      {/* Garis Pembatas Kop Surat Resmi: Garis tebal ganda standar naskah dinas */}
      <div className="w-full">
        <div className="w-full border-b-[3px] border-black" />
        <div className="w-full border-b-[1px] border-black mt-[2px]" />
      </div>
    </div>
  );
};
