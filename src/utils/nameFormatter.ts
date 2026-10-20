/**
 * Mengubah format nama pegawai menjadi huruf kapital di awal setiap kata (Title Case),
 * dengan mempertahankan gelar akademik/profesi tetap kapital sesuai kaidah tata naskah dinas.
 * Contoh:
 * - "DONNY MANU, ST." -> "Donny Manu, ST."
 * - "BERHAS RICARDO PANJAITAN, SAB" -> "Berhas Ricardo Panjaitan, SAB"
 * - "RIENNA PRATIWI ARTYANTI, S.E." -> "Rienna Pratiwi Artyanti, S.E."
 * - "Yuniar Vidianto, S.T., M.T." -> "Yuniar Vidianto, S.T., M.T."
 */
export function formatEmployeeName(fullName: string): string {
  if (!fullName) return '';

  // Pisahkan bagian nama dan bagian gelar berdasarkan koma pertama
  const commaIndex = fullName.indexOf(',');
  
  if (commaIndex === -1) {
    // Tidak ada gelar, ubah tiap kata nama menjadi huruf kapital di awal
    return formatNameWords(fullName);
  }

  const namePart = fullName.substring(0, commaIndex);
  const titlePart = fullName.substring(commaIndex); // Menyertakan koma dan gelar sesudahnya

  const formattedNamePart = formatNameWords(namePart);
  
  // Kembalikan nama yang diformat + gelar asli (tetap kapital)
  return `${formattedNamePart}${titlePart}`;
}

function formatNameWords(words: string): string {
  return words
    .trim()
    .split(/\s+/)
    .map((word) => {
      // Pertahankan singkatan awalan nama seperti RR. atau M. atau Drs.
      if (word.endsWith('.') && word.length <= 4) {
        return word.toUpperCase();
      }

      // Dukung tanda hubung (-) atau petik (') seperti Qurotu A'yun
      return word
        .split('-')
        .map((segment) =>
          segment
            .split("'")
            .map((sub) => {
              if (!sub) return '';
              return sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
            })
            .join("'")
        )
        .join('-');
    })
    .join(' ');
}

/**
 * Memformat NIP tanpa titik dan tanpa spasi di dalam angka
 * Contoh: "19900402 202521 1 144" -> "199004022025211144"
 */
export function formatNip(nip: string | undefined | null): string {
  if (!nip) return '';
  return nip.replace(/[\s.-]/g, '');
}

