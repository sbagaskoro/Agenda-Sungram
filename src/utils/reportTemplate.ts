import { AgendaItem } from '../types';

export const getDayNameIndo = (dateStr: string): string => {
  try {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return days[d.getDay()] || 'Hari Kegiatan';
    }
  } catch {}
  return 'Hari Kegiatan';
};

export const formatDateIndo = (dateStr: string): string => {
  try {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthName = months[parseInt(parts[1], 10) - 1];
      const year = parts[0];
      return `${day} ${monthName} ${year}`;
    }
  } catch {}
  return dateStr;
};

/**
 * Template sistematika resmi laporan hasil pelaksanaan tugas/disposisi
 * Mengacu pada format standar naskah dinas:
 * - Salam pembuka
 * - I. PELAKSANAAN
 * - II. HADIR DALAM KEGIATAN
 * - III. SUBSTANSI
 * - IV. TINDAK LANJUT
 * - Salam penutup
 */
export const buildSystematicReportTemplate = (agenda: AgendaItem | null): string => {
  const subject = agenda?.subject || '[Nama Kegiatan / Perihal Rapat]';
  const eventDate = agenda?.eventDate || '';
  const day = eventDate ? getDayNameIndo(eventDate) : '[Hari]';
  const dateFormatted = eventDate ? formatDateIndo(eventDate) : '[Tanggal Pelaksanaan]';
  const location = agenda?.location || '[Tempat / Ruang Pelaksanaan]';
  const sender = agenda?.sender || '[Instansi Pengirim / Penyelenggara]';
  const letterNumber = agenda?.letterNumber || '[Nomor Surat]';

  return `Menindaklanjuti Surat dari ${sender}, Nomor ${letterNumber}, bersama ini dilaporkan dengan hormat hasil giat ${subject} dengan hasil sebagai berikut:

I. PELAKSANAAN
Hari : ${day}
Tanggal : ${dateFormatted}
Tempat: ${location}

II. HADIR DALAM KEGIATAN
Dibuka oleh : [Nama/Jabatan Pembuka Acara]
Pimpinan : [Nama/Jabatan Pimpinan Rapat]
Peserta :
1. Subbag Penyusunan Program dan Anggaran
2. ${sender}
3. [Perangkat Daerah / Stakeholder Terkait Lainnya]

III. SUBSTANSI
1. Landasan Hukum :
   a) [Dasar Surat / Regulasi Acuan / Disposisi Dinas]
2. Tujuan Umum : [Tujuan Umum Kegiatan]
   Tujuan Khusus :
   a) [Tujuan Khusus 1 / Verifikasi Dokumen & Administrasi]
   b) [Tujuan Khusus 2 / Validasi & Sinkronisasi Teknis]
3. Hasil Kegiatan / Pembahasan :
   a. [Poin capaian / hasil verifikasi indikator]
   b. [Poin kesepakatan teknis / hasil pembahasan materi]

IV. TINDAK LANJUT
1. [Rencana tindak lanjut / perbaikan bukti dukung / penyusunan resume]
2. Melaporkan hasil pembahasan dan rekomendasi kepada Kasubbag Sungram

Demikian dilaporkan untuk dapat menjadi periksa dan mohon petunjuk/arahan lebih lanjut.`;
};

/**
 * Template resmi Nota Dinas Dinas Perhubungan Provinsi Jawa Timur
 */
export const buildNotaDinasSubstanceTemplate = (agenda: AgendaItem | null): string => {
  const subject = agenda?.subject || '[Perihal Kegiatan / Undangan Dinas]';
  const eventDate = agenda?.eventDate || '';
  const day = eventDate ? getDayNameIndo(eventDate) : '[Hari]';
  const dateFormatted = eventDate ? formatDateIndo(eventDate) : '[Tanggal Pelaksanaan]';
  const time = agenda?.startTime ? `${agenda.startTime} - ${agenda.endTime || 'selesai'} WIB` : '09.00 WIB - selesai';
  const location = agenda?.location || '[Tempat Pelaksanaan]';
  const sender = agenda?.sender || '[Instansi Pengirim]';
  const letterNumber = agenda?.letterNumber || '[Nomor Surat]';

  return `Menindaklanjuti Surat dari ${sender}, Nomor ${letterNumber}, bersama ini dilaporkan dengan hormat hasil pelaksanaan giat ${subject} dengan rincian sebagai berikut:

I. PELAKSANAAN
Hari, Tanggal   : ${day}, ${dateFormatted}
Waktu           : ${time}
Tempat          : ${location}
Penyelenggara   : ${sender}

II. HADIR DALAM KEGIATAN
1. Subbag Penyusunan Program dan Anggaran, Dinas Perhubungan Provinsi Jawa Timur
2. ${sender}
3. [Perangkat Daerah / Stakeholder Terkait Lainnya]

III. HASIL PEMBAHASAN / SUBSTANSI
1. Landasan Yuridis & Kebijakan:
   Telah diverifikasi kesesuaian dokumen dengan pedoman teknis dan tata kelola program kerja tahun berjalan.
2. Hasil Pembahasan:
   a. Seluruh instrumen capaian indikator dan data pendukung telah dipaparkan dan dievaluasi bersama.
   b. Disepakati penyelarasan target output dan percepatan pemenuhan dokumen administrasi.

IV. KESIMPULAN DAN REKOMENDASI TINDAK LANJUT
1. Menyusun matriks tindak lanjut dan menyerahkan dokumen kelengkapan sesuai rekomendasi rapat.
2. Melaporkan progres pelaksanaan secara berjenjang kepada Kepala Sub Bagian Penyusunan Program dan Anggaran.

Demikian nota dinas ini disampaikan untuk dapat menjadi periksa dan mohon petunjuk serta arahan lebih lanjut.`;
};

/**
 * Template Notulen Rapat Kinerja & Evaluasi Kinerja (Persis referensi resmi Dishub Jatim)
 */
export const buildNotulenKinerjaSubstanceTemplate = (agenda: AgendaItem | null): string => {
  const eventDate = agenda?.eventDate || '';
  const day = eventDate ? getDayNameIndo(eventDate) : 'Senin';
  const dateFormatted = eventDate ? formatDateIndo(eventDate) : '6 Juli 2026';
  const startTime = agenda?.startTime ? `${agenda.startTime} WIB` : '12.00 WIB';
  const location = agenda?.location || 'Ruang Rapat Sub Bagian Penyusunan Program dan Anggaran';
  const subject = agenda?.subject || 'Rapat Kinerja dan Evaluasi Kinerja';

  return `I. PELAKSANAAN
Hari, Tanggal   : ${day} , ${dateFormatted}
Waktu           : ${startTime} – selesai
Tempat          : ${location}
Pimpinan Rapat  : Kepala Sub Bagian Penyusunan Program dan Anggaran

II. AGENDA PEMBAHASAN
1. Pembahasan tindak lanjut ${subject}
2. Persiapan dan penelaahan materi program sektor perhubungan
3. Deadline percepatan penyelesaian pekerjaan on going

III. RINGKASAN ARAHAN KASUBAG SUNGRAM
1. Disampaikan arahan agar kelengkapan form isian dan data pendukung disiapkan serta divalidasi secara cermat dengan mengacu pada pedoman teknis yang berlaku.
2. Menginventarisasi kebutuhan sarana pendukung dan koordinasi antar unit kerja pengampu untuk memastikan sinkronisasi data dukung kinerja.
3. Menindaklanjuti pergeseran anggaran atau optimalisasi pos pembiayaan kegiatan sesuai dengan regulasi penatausahaan anggaran yang sah.
4. Disampaikan arahan dari Bapak Kepala Subbagian Penyusunan Program dan Anggaran agar seluruh pelaksanaan tugas dan kegiatan dapat diselesaikan sesuai dengan target waktu (timeline) yang telah ditetapkan, guna mendukung ketercapaian program dan kinerja organisasi secara optimal.

IV. TINDAK LANJUT
1. Melakukan perbaikan dan penyusunan resume arahan rapat paling lambat dalam 3 hari kerja.
2. Mengoordinasikan hasil tindak lanjut kepada pimpinan dan pihak berkepentingan secara berkala.`;
};

/**
 * Contoh naskah dinas riil lengkap: Pembinaan Kabupaten/Kota Sehat (Dishub Jatim)
 */
export const FULL_EXAMPLE_KKS_REPORT = `Menindaklanjuti Surat dari Bappeda Provinsi Jawa Timur, Nomor 000.1.2/145/202.1/2026, bersama ini dilaporkan dengan hormat hasil giat Pembinaan Kabupaten/Kota Sehat Tingkat Provinsi Jawa Timur Tahun 2026 di Kabupaten Kediri dengan hasil sebagai berikut:

I. PELAKSANAAN
Hari : Selasa s.d Rabu
Tanggal : 15 s.d 16 September 2026
Tempat: Kantor Pemkab Kediri

II. HADIR DALAM KEGIATAN
Dibuka oleh : Bapak Sekretaris Daerah Kab. Kediri 
Pimpinan : Kepala Dinas Kesehatan Kab. Kediri
Peserta :
1. Tim Pembina Kab/Kota Sehat Tingkat Provinsi
2. Tim Pembina Kabupaten Sehat Kab. Kediri
3. Perangkat Daerah Dilingkungan Pemkab Kediri
4. Forum Kabupaten Sehat Kab. Kediri

III. SUBSTANSI
1. Landasan Hukum :
   a) Undang - Undang Republik Indonesia Nomor 17 Tahun 2023 tentang Kesehatan
   b) Peraturan Bersama Menteri Dalam Negeri dan Menteri Kesehatan Nomor 34 Tahun 2005 dan Nomor 1138/Menkes/PB/VIII/2005 tentang Penyelenggaraan Kabupaten/Kota Sehat
2. Tujuan Umum : Pelaksanaan Pembinaan dan Pendampingan Penyelenggaraan Kabupaten Kota Sehat
   Tujuan Khusus :
   a) Melaksanakan verifikasi dokumen terhadap Kelembagaan dan capaian indikator 9 Tatanan kabupaten/ Kota Sehat
   b) Melakukan Validasi Lapangan terhadap capaian 9 Tatanan Kabupaten/Kota untuk memastikan kesesuaian antara dokumen dan kenyataan penyelenggaraan di lapangan.
3. Dinas Perhubungan Provinsi Jawa Timur mendapat tugas untuk memverifikasi Tatanan 7 (Tatanan Transportasi dan Tertib Lalu Lintas). Adapun hasil verifikasi sebagai berikut :
   a. Indikator 1 : Adanya regulasi terkait penyediaan layanan transportasi jalan, kawasan tertib lalu lintas, sistem manajemen keselamatan lalu lintas dan angkutan jalan (hasil verifikasi = 50)
   b. Indikator 2 : Persentase kendaraan umum yang laik jalan, minimal ≥ 80% (hasil verifikasi = 100)
   c. Indikator 3 : Persentase penurunan tingkat fatalitas akibat kecelakaan dalam tahun berjalan ≤ 65% (hasil verifikasi = 100)
   d. Indikator 4 : Adanya sistem layanan pertolongan kecelakaan yang cepat dan terintegrasi kesiapsiagaan dalam penanganan korban kecelakaan (hasil verifikasi = 100)
   e. Indikator 5 : Adanya program pemeriksaan NAPZA atau narkoba terhadap pengemudi (hasil verifikasi = 75)
   f. Indikator 6 : Terminal yang memenuhi syarat kesehatan (hasil verifikasi = 50)
   g. Indikator 7 : Persentase angkutan umum yang memiliki BLUe (Bukti Lulus Uji Elektronik) (hasil verifikasi = 100)
   h. Indikator 8 : Keberadaan fasilitas jalur pejalan kaki (trotoar) bagi masyarakat umum dan penyandang disabilitas (hasil verifikasi = 100)
   i. Indikator 9 : Jumlah titik fasilitas lajur sepeda (hasil verifikasi = 100)
   j. Indikator 10 : Adanya Zona Selamat Sekolah (ZoSS) (hasil verifikasi = 100)
   k. Indikator 11 : Pengawasan dan penindakan terhadap emisi gas buang kendaraan (hasil verifikasi = 100)

IV. TINDAK LANJUT
1. Perangkat Daerah pengampu bersama forum dan pokja memetakan kekurangan per indikator berdasarkan hasil verifikasi provinsi, termasuk kebutuhan dokumen, regulasi, dan intervensi program.
2. Perangkat Daerah pengampu memperbaiki dan menginput bukti dukung sesuai indikator, kemudian membahas perbedaan penilaian bersama Tim Pembina KKS Provinsi Jawa Timur dalam desk atau pendampingan lanjutan.
3. Tim Pembina KKS Provinsi Jawa Timur memberikan masukan teknis dan menelaah perbaikan yang diajukan.

Demikian dilaporkan untuk dapat menjadi periksa dan mohon petunjuk/arahan lebih lanjut.`;
