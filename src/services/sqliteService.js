import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'

const DB_NAME = 'jemaat_db'
const DB_VERSION = 1
let sqlite
let db

const seedMembers = [
  {
    name: 'Yonathan Mantiri',
    gender: 'L',
    birthPlace: 'Manado',
    birthDate: '1991-04-12',
    phone: '0812-3456-9901',
    email: 'yonathan.mantiri@mail.com',
    area: 'Malalayang',
    family: 'Keluarga Mantiri',
    status: 'Aktif',
    membership: 'Anggota',
    baptismDate: '2009-05-12',
    address: 'Perumahan Malalayang Permai Blok C3',
    notes: 'Pelayan musik',
    emergencyContact: 'Rey Mantiri - 0813-1122-3434',
    attendanceRate: 92,
    attendanceNote: 'Hadir Minggu lalu',
    photo: 'https://cdn.quasar.dev/img/avatar1.jpg',
  },
  {
    name: 'Ruth Tumiwa',
    gender: 'P',
    birthPlace: 'Tomohon',
    birthDate: '1996-09-30',
    phone: '0821-4567-8032',
    email: 'ruth.tumiwa@mail.com',
    area: 'Paal 2',
    family: 'Keluarga Tumiwa',
    status: 'Aktif',
    membership: 'Anggota',
    baptismDate: '2013-02-14',
    address: 'Jl. Raya Paal 2 No. 21',
    notes: 'Koordinator Komsel',
    emergencyContact: 'Eva Tumiwa - 0821-4432-1122',
    attendanceRate: 86,
    attendanceNote: 'Hadir Minggu lalu',
    photo: 'https://cdn.quasar.dev/img/avatar2.jpg',
  },
  {
    name: 'Grace Poluan',
    gender: 'P',
    birthPlace: 'Airmadidi',
    birthDate: '2002-01-18',
    phone: '0813-8822-7788',
    email: 'grace.poluan@mail.com',
    area: 'Tikala',
    family: 'Keluarga Poluan',
    status: 'Aktif',
    membership: 'Simpatisan',
    baptismDate: '',
    address: 'Kompleks Tikala Elok Blok B5',
    notes: 'Persiapan baptisan',
    emergencyContact: 'Riko Poluan - 0813-1122-0098',
    attendanceRate: 78,
    attendanceNote: 'Hadir 2 minggu lalu',
    photo: 'https://cdn.quasar.dev/img/avatar3.jpg',
  },
  {
    name: 'Rio Langi',
    gender: 'L',
    birthPlace: 'Bitung',
    birthDate: '1988-12-05',
    phone: '0852-7612-2299',
    email: 'rio.langi@mail.com',
    area: 'Tuminting',
    family: 'Keluarga Langi',
    status: 'Nonaktif',
    membership: 'Anggota',
    baptismDate: '2005-08-21',
    address: 'Jl. Tuminting Utara No. 9',
    notes: 'Perlu kunjungan',
    emergencyContact: 'Ina Langi - 0852-4431-2244',
    attendanceRate: 42,
    attendanceNote: 'Belum hadir 1 bulan',
    photo: 'https://cdn.quasar.dev/img/avatar4.jpg',
  },
  {
    name: 'Maria Liow',
    gender: 'P',
    birthPlace: 'Manado',
    birthDate: '1994-03-02',
    phone: '0812-9900-1122',
    email: 'maria.liow@mail.com',
    area: 'Paal 2',
    family: 'Keluarga Liow',
    status: 'Aktif',
    membership: 'Anggota',
    baptismDate: '2010-11-14',
    address: 'Kompleks Paal 2 Indah No. 7',
    notes: 'Pelayan multimedia',
    emergencyContact: 'Sari Liow - 0812-7766-3344',
    attendanceRate: 88,
    attendanceNote: 'Hadir Minggu lalu',
    photo: 'https://cdn.quasar.dev/img/avatar5.jpg',
  },
]

let webStoreInitialized = false

const ensureConnection = async () => {
  if (!sqlite) {
    sqlite = new SQLiteConnection(CapacitorSQLite)
  }

  if (Capacitor.getPlatform() === 'web' && !webStoreInitialized) {
    await sqlite.initWebStore()
    webStoreInitialized = true
  }

  if (!db) {
    db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false)
    await db.open()
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS jemaat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender TEXT,
      birthPlace TEXT,
      birthDate TEXT,
      phone TEXT,
      email TEXT,
      area TEXT,
      family TEXT,
      status TEXT,
      membership TEXT,
      baptismDate TEXT,
      address TEXT,
      notes TEXT,
      emergencyContact TEXT,
      attendanceRate INTEGER DEFAULT 0,
      attendanceNote TEXT DEFAULT '',
      photo TEXT
    );
  `)
}

const seedIfEmpty = async () => {
  const result = await db.query('SELECT COUNT(1) as total FROM jemaat')
  const total = result?.values?.[0]?.total ?? 0
  if (total > 0) return

  for (const member of seedMembers) {
    await insertJemaat(member)
  }
}

export const initJemaatDb = async () => {
  if (!sqlite) {
    sqlite = new SQLiteConnection(CapacitorSQLite)
  }

  if (Capacitor.getPlatform() === 'web') {
    await customElements.whenDefined('jeep-sqlite')
  }

  await ensureConnection()
  await seedIfEmpty()
}

export const getAllJemaat = async () => {
  await ensureConnection()
  const result = await db.query('SELECT * FROM jemaat ORDER BY id DESC')
  return result?.values ?? []
}

export const insertJemaat = async (payload) => {
  await ensureConnection()

  const data = {
    name: payload.name || payload.fullName || '',
    gender: payload.gender || '',
    birthPlace: payload.birthPlace || '',
    birthDate: payload.birthDate || '',
    phone: payload.phone || '',
    email: payload.email || '',
    area: payload.area || '',
    family: payload.family || '',
    status: payload.status || 'Aktif',
    membership: payload.membership || 'Anggota',
    baptismDate: payload.baptismDate || '',
    address: payload.address || '',
    notes: payload.notes || '',
    emergencyContact: payload.emergencyContact || '',
    attendanceRate: payload.attendanceRate ?? 0,
    attendanceNote: payload.attendanceNote || 'Baru ditambahkan',
    photo: payload.photo || 'https://cdn.quasar.dev/img/avatar1.jpg',
  }

  const statement = `
    INSERT INTO jemaat (
      name, gender, birthPlace, birthDate, phone, email, area, family, status,
      membership, baptismDate, address, notes, emergencyContact, attendanceRate,
      attendanceNote, photo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `

  const values = [
    data.name,
    data.gender,
    data.birthPlace,
    data.birthDate,
    data.phone,
    data.email,
    data.area,
    data.family,
    data.status,
    data.membership,
    data.baptismDate,
    data.address,
    data.notes,
    data.emergencyContact,
    data.attendanceRate,
    data.attendanceNote,
    data.photo,
  ]

  const result = await db.run(statement, values)
  return {
    id: result?.changes?.lastId,
    ...data,
  }
}
