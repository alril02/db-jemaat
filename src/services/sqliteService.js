import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'
import { runMigrations } from 'src/database/migrations'
import { runSeeders } from 'src/database/seeders'

const DB_NAME = 'jemaat_db'
const DB_VERSION = 1
let sqlite
let db
let webStoreInitialized = false

const getConnection = async () => {
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
    await db.execute('PRAGMA foreign_keys = ON;')
  }

  return db
}

const ensureDatabaseReady = async () => {
  const connection = await getConnection()
  await runMigrations(connection)
  await runSeeders(connection, { includeDemoData: true })
  return connection
}

const ensureNamedRow = async (table, keyColumn, keyValue, insertColumns, insertValues) => {
  const connection = await getConnection()
  const existing = await connection.query(`SELECT id FROM ${table} WHERE ${keyColumn} = ? LIMIT 1;`, [keyValue])
  const existingId = existing?.values?.[0]?.id
  if (existingId) {
    return existingId
  }

  const placeholders = insertColumns.map(() => '?').join(', ')
  const statement = `INSERT INTO ${table} (${insertColumns.join(', ')}) VALUES (${placeholders});`
  const result = await connection.run(statement, insertValues)
  return result?.changes?.lastId ?? result?.lastId ?? null
}

const mapJemaatRow = (row) => ({
  id: row.id,
  uuid: row.uuid,
  name: row.nama_lengkap,
  fullName: row.nama_lengkap,
  gender: row.jenis_kelamin,
  birthPlace: row.tempat_lahir,
  birthDate: row.tanggal_lahir,
  phone: row.no_hp,
  email: row.email,
  area: row.area,
  family: row.family,
  status: row.status_jemaat,
  membership: row.status_keanggotaan,
  baptismDate: row.tanggal_baptis,
  address: row.alamat,
  notes: row.catatan,
  emergencyContact: row.kontak_darurat,
  attendanceRate: row.attendance_rate ?? 0,
  attendanceNote: row.attendance_note ?? 'Belum ada data presensi',
  photo: row.foto || 'https://cdn.quasar.dev/img/avatar1.jpg',
})

export const initJemaatDb = async () => {
  if (Capacitor.getPlatform() === 'web') {
    await customElements.whenDefined('jeep-sqlite')
  }

  await ensureDatabaseReady()
}

export const getAllJemaat = async () => {
  const connection = await ensureDatabaseReady()
  const result = await connection.query(`
    SELECT
      j.id,
      j.uuid,
      j.nama_lengkap,
      j.jenis_kelamin,
      j.tempat_lahir,
      j.tanggal_lahir,
      j.no_hp,
      j.email,
      w.nama AS area,
      k.nama_keluarga AS family,
      j.status_jemaat,
      j.status_keanggotaan,
      j.tanggal_baptis,
      j.alamat,
      j.catatan,
      j.kontak_darurat,
      j.foto,
      COALESCE(AVG(CASE WHEN p.status_presensi = 'hadir' THEN 100 ELSE 0 END), 0) AS attendance_rate,
      COALESCE(MAX(p.waktu_presensi), '') AS attendance_note
    FROM jemaat j
    JOIN keluarga k ON k.id = j.keluarga_id
    JOIN wilayah w ON w.id = j.wilayah_id
    LEFT JOIN presensi_ibadah p ON p.jemaat_id = j.id
    GROUP BY j.id
    ORDER BY j.id DESC;
  `)

  return (result?.values ?? []).map(mapJemaatRow)
}

export const insertJemaat = async (payload) => {
  const connection = await ensureDatabaseReady()
  const baseUuid = payload.uuid || `jemaat-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const wilayahName = payload.area || payload.wilayah || 'Wilayah Umum'
  const wilayahCode = (wilayahName || 'WIL').toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 10) || 'WIL'
  const familyName = payload.family || payload.namaKeluarga || 'Keluarga Baru'

  const wilayahId = await ensureNamedRow(
    'wilayah',
    'nama',
    wilayahName,
    ['uuid', 'nama', 'kode', 'penanggung_jawab', 'catatan'],
    [
      payload.wilayah_uuid || `wilayah-${wilayahCode.toLowerCase()}`,
      wilayahName,
      payload.wilayah_kode || wilayahCode,
      payload.penanggung_jawab || null,
      payload.catatan_wilayah || null,
    ],
  )

  const keluargaId = await ensureNamedRow(
    'keluarga',
    'nama_keluarga',
    familyName,
    ['uuid', 'wilayah_id', 'nama_keluarga', 'kepala_keluarga', 'alamat', 'no_hp_keluarga', 'catatan'],
    [
      payload.keluarga_uuid || `keluarga-${familyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      wilayahId,
      familyName,
      payload.kepala_keluarga || payload.fullName || payload.name || null,
      payload.address || null,
      payload.no_hp || payload.phone || null,
      payload.notes || null,
    ],
  )

  const statement = `
    INSERT INTO jemaat (
      uuid, keluarga_id, wilayah_id, nama_lengkap, jenis_kelamin, tempat_lahir,
      tanggal_lahir, no_hp, email, alamat, status_jemaat, status_keanggotaan,
      tanggal_baptis, kontak_darurat, foto, catatan
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `

  const values = [
    baseUuid,
    keluargaId,
    wilayahId,
    payload.name || payload.fullName || '',
    payload.gender || '',
    payload.birthPlace || '',
    payload.birthDate || '',
    payload.phone || '',
    payload.email || '',
    payload.address || '',
    payload.status || 'Aktif',
    payload.membership || 'Anggota',
    payload.baptismDate || '',
    payload.emergencyContact || '',
    payload.photo || 'https://cdn.quasar.dev/img/avatar1.jpg',
    payload.notes || '',
  ]

  const result = await connection.run(statement, values)

  return {
    id: result?.changes?.lastId,
    uuid: baseUuid,
    ...payload,
  }
}
