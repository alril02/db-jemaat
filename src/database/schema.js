export const INITIAL_SCHEMA_VERSION = '001_initial_schema'

export const CREATE_SCHEMA = [
  `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      nama_role TEXT NOT NULL,
      kode_role TEXT NOT NULL UNIQUE,
      deskripsi TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      role_id INTEGER NOT NULL,
      nama_lengkap TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      no_hp TEXT,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      last_login_at TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS wilayah (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      nama TEXT NOT NULL,
      kode TEXT NOT NULL UNIQUE,
      penanggung_jawab TEXT,
      catatan TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS keluarga (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      wilayah_id INTEGER NOT NULL,
      nama_keluarga TEXT NOT NULL,
      kepala_keluarga TEXT,
      alamat TEXT,
      no_hp_keluarga TEXT,
      catatan TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (wilayah_id) REFERENCES wilayah(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS jemaat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      keluarga_id INTEGER NOT NULL,
      wilayah_id INTEGER NOT NULL,
      nama_lengkap TEXT NOT NULL,
      jenis_kelamin TEXT,
      tempat_lahir TEXT,
      tanggal_lahir TEXT,
      no_hp TEXT,
      email TEXT,
      alamat TEXT,
      status_jemaat TEXT NOT NULL DEFAULT 'Aktif',
      status_keanggotaan TEXT NOT NULL DEFAULT 'Anggota',
      tanggal_baptis TEXT,
      kontak_darurat TEXT,
      foto TEXT,
      catatan TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (keluarga_id) REFERENCES keluarga(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (wilayah_id) REFERENCES wilayah(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS event_ibadah (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      created_by_user_id INTEGER NOT NULL,
      nama_event TEXT NOT NULL,
      jenis_event TEXT,
      tanggal TEXT NOT NULL,
      jam_mulai TEXT,
      jam_selesai TEXT,
      lokasi TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      catatan TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS presensi_ibadah (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      event_ibadah_id INTEGER NOT NULL,
      jemaat_id INTEGER NOT NULL,
      recorded_by_user_id INTEGER NOT NULL,
      status_presensi TEXT NOT NULL DEFAULT 'hadir',
      waktu_presensi TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      metode_presensi TEXT,
      catatan TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (event_ibadah_id) REFERENCES event_ibadah(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (jemaat_id) REFERENCES jemaat(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      UNIQUE (event_ibadah_id, jemaat_id)
    );
  `
]

export const DEFAULT_ROLES = [
  {
    uuid: 'role-admin',
    nama_role: 'Admin',
    kode_role: 'admin',
    deskripsi: 'Akses penuh ke data dan konfigurasi aplikasi',
  },
  {
    uuid: 'role-petugas-presensi',
    nama_role: 'Petugas Presensi',
    kode_role: 'petugas_presensi',
    deskripsi: 'Mengelola data presensi ibadah',
  },
  {
    uuid: 'role-viewer',
    nama_role: 'Viewer',
    kode_role: 'viewer',
    deskripsi: 'Hanya dapat melihat data',
  },
]

export const DEFAULT_ADMIN_USER = {
  uuid: 'user-admin',
  nama_lengkap: 'Admin Sistem',
  username: 'admin',
  password_hash: 'CHANGE_ME',
  pin_hash: 'CHANGE_ME',
  no_hp: '',
  email: '',
  status: 'active',
  sync_status: 'pending',
}

export const DEFAULT_DEMO_WILAYAH = [
  {
    uuid: 'wilayah-malalayang',
    nama: 'Wilayah Malalayang',
    kode: 'MAL',
    penanggung_jawab: 'Admin Sistem',
    catatan: 'Data contoh awal',
  },
]

export const DEFAULT_DEMO_KELUARGA = [
  {
    uuid: 'keluarga-mantiri',
    wilayah_uuid: 'wilayah-malalayang',
    nama_keluarga: 'Keluarga Mantiri',
    kepala_keluarga: 'Yonathan Mantiri',
    alamat: 'Perumahan Malalayang Permai Blok C3',
    no_hp_keluarga: '0812-3456-9901',
    catatan: 'Data contoh awal',
  },
]

export const DEFAULT_DEMO_JEMAAT = [
  {
    uuid: 'jemaat-yonathan-mantiri',
    wilayah_uuid: 'wilayah-malalayang',
    keluarga_uuid: 'keluarga-mantiri',
    nama_lengkap: 'Yonathan Mantiri',
    jenis_kelamin: 'L',
    tempat_lahir: 'Manado',
    tanggal_lahir: '1991-04-12',
    no_hp: '0812-3456-9901',
    email: 'yonathan.mantiri@mail.com',
    alamat: 'Perumahan Malalayang Permai Blok C3',
    status_jemaat: 'Aktif',
    status_keanggotaan: 'Anggota',
    tanggal_baptis: '2009-05-12',
    kontak_darurat: 'Rey Mantiri - 0813-1122-3434',
    foto: 'https://cdn.quasar.dev/img/avatar1.jpg',
    catatan: 'Pelayan musik',
  },
]

