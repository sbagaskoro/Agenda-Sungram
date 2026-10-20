import React, { useState } from 'react';
import logoJatimSvg from '../assets/logo-provinsi-jawa-timur.svg';
import logoJatimPng from '../assets/logo-provinsi-jawa-timur.png';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

/**
 * Lambang Resmi Pemerintah Provinsi Jawa Timur
 * Berdasarkan aset resmi Pemprov Jatim (logo-provinsi-jawa-timur.png / .svg)
 * Menampilkan Perisai Segilima, Bintang Emas, Tugu Pahlawan, Candi Bentar,
 * Untaian Padi & Kapas, Rantai, Ombak, dan Semboyan "JER BASUKI MAWA BEYA".
 */
export const LogoPemprovJatim: React.FC<LogoProps> = ({
  className = 'w-16 h-20 sm:w-20 sm:h-24',
  width,
  height,
  alt = 'Lambang Pemerintah Provinsi Jawa Timur',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // Vector fallback jika aset gambar bermasalah
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 140 172"
        width={width || 70}
        height={height || 86}
        className={className}
        aria-label={alt}
      >
        <path
          d="M 20,24 C 45,14 95,14 120,24 C 124,58 126,102 70,146 C 14,102 16,58 20,24 Z"
          fill="#0080c9"
          stroke="#000000"
          strokeWidth="3"
        />
        <text x="70" y="146" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#000">
          JER BASUKI MAWA BEYA
        </text>
      </svg>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
    >
      <picture className="contents">
        <source srcSet={logoJatimSvg} type="image/svg+xml" />
        <img
          src={logoJatimPng}
          alt={alt}
          onError={() => setHasError(true)}
          className="max-h-full max-w-full w-auto h-auto object-contain select-none pointer-events-none drop-shadow-xs"
          loading="eager"
          decoding="sync"
        />
      </picture>
    </div>
  );
};
