import { ensureDatabaseReady, getDatabase } from 'src/services/sqliteService'

const DEFAULT_PHOTO = 'https://cdn.quasar.dev/img/avatar1.jpg'

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
  wilayahId: row.wilayah_id,
  family: row.family,
  keluargaId: row.keluarga_id,
  status: row.status_jemaat,
  statusJemaat: row.status_jemaat,
  membership: row.status_keanggotaan,
  birthDateRaw: row.tanggal_lahir,
  baptismDate: row.tanggal_baptis,
  address: row.alamat,
  notes: row.catatan,
  emergencyContact: row.kontak_darurat,
  photo: row.foto || DEFAULT_PHOTO,
  attendanceRate: row.attendance_rate ?? 0,
  attendanceNote: row.attendance_note ?? 'Belum ada data presensi',
})

const queryOne = async (sql, params = []) => {
  const db = await getDatabase()
  const result = await db.query(sql, params)
  return result?.values?.[0] ?? null
}

const queryMany = async (sql, params = []) => {
  const db = await getDatabase()
  const result = await db.query(sql, params)
  return result?.values ?? []
}

const run = async (sql, params = []) => {
  const db = await getDatabase()
  return db.run(sql, params)
}

const ensureLookupRow = async (table, matchColumn, matchValue, insertColumns, insertValues) => {
  const existing = await queryOne(
    `SELECT id FROM ${table} WHERE ${matchColumn} = ? AND deleted_at IS NULL LIMIT 1;`,
    [matchValue],
  )
  if (existing?.id) {
    return existing.id
  }

  const placeholders = insertColumns.map(() => '?').join(', ')
  const result = await run(`INSERT INTO ${table} (${insertColumns.join(', ')}) VALUES (${placeholders});`, insertValues)
  return result?.changes?.lastId ?? null
}

const ensureWilayah = async (payload = {}) => {
  if (payload.wilayah_id) {
    return payload.wilayah_id
  }

  const wilayahName = payload.area || payload.wilayah || 'Wilayah Umum'
  const wilayahCode = (payload.wilayah_kode || wilayahName || 'WIL')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 10) || 'WIL'

  return ensureLookupRow(
    'wilayah',
    'kode',
    payload.wilayah_kode || wilayahCode,
    ['uuid', 'nama', 'kode', 'penanggung_jawab', 'catatan'],
    [
      payload.wilayah_uuid || `wilayah-${wilayahCode.toLowerCase()}`,
      wilayahName,
      payload.wilayah_kode || wilayahCode,
      payload.penanggung_jawab || null,
      payload.catatan_wilayah || null,
    ],
  )
}

const ensureKeluarga = async (payload = {}, wilayahId) => {
  if (payload.keluarga_id) {
    return payload.keluarga_id
  }

  const familyName = payload.family || payload.namaKeluarga || 'Keluarga Baru'
  const familyCode = familyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  return ensureLookupRow(
    'keluarga',
    'nama_keluarga',
    familyName,
    ['uuid', 'wilayah_id', 'nama_keluarga', 'kepala_keluarga', 'alamat', 'no_hp_keluarga', 'catatan'],
    [
      payload.keluarga_uuid || `keluarga-${familyCode}`,
      wilayahId,
      familyName,
      payload.kepala_keluarga || payload.fullName || payload.name || null,
      payload.address || null,
      payload.no_hp || payload.phone || null,
      payload.notes || null,
    ],
  )
}

const buildSelectClause = () => `
  SELECT
    j.id,
    j.uuid,
    j.nama_lengkap,
    j.jenis_kelamin,
    j.tempat_lahir,
    j.tanggal_lahir,
    j.no_hp,
    j.email,
    w.id AS wilayah_id,
    w.nama AS area,
    k.id AS keluarga_id,
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
`

export const getAllJemaat = async () => {
  await ensureDatabaseReady()
  const rows = await queryMany(
    `${buildSelectClause()}
     WHERE j.deleted_at IS NULL
     GROUP BY j.id
     ORDER BY j.id DESC;`,
  )
  return rows.map(mapJemaatRow)
}

export const getJemaatById = async (id) => {
  await ensureDatabaseReady()
  const row = await queryOne(
    `${buildSelectClause()}
     WHERE j.id = ? AND j.deleted_at IS NULL
     GROUP BY j.id
     LIMIT 1;`,
    [id],
  )
  return row ? mapJemaatRow(row) : null
}

export const getJemaatByWilayah = async (wilayahId) => {
  await ensureDatabaseReady()
  const rows = await queryMany(
    `${buildSelectClause()}
     WHERE j.wilayah_id = ? AND j.deleted_at IS NULL
     GROUP BY j.id
     ORDER BY j.nama_lengkap ASC;`,
    [wilayahId],
  )
  return rows.map(mapJemaatRow)
}

export const searchJemaat = async (keyword) => {
  const normalized = `%${String(keyword || '').trim()}%`
  await ensureDatabaseReady()
  const rows = await queryMany(
    `${buildSelectClause()}
     WHERE j.deleted_at IS NULL AND (
       j.nama_lengkap LIKE ? OR
       k.nama_keluarga LIKE ? OR
       w.nama LIKE ? OR
       j.no_hp LIKE ?
     )
     GROUP BY j.id
     ORDER BY j.nama_lengkap ASC;`,
    [normalized, normalized, normalized, normalized],
  )
  return rows.map(mapJemaatRow)
}

export const createJemaat = async (payload) => {
  await ensureDatabaseReady()
  const wilayahId = await ensureWilayah(payload)
  const keluargaId = await ensureKeluarga(payload, wilayahId)
  const db = await getDatabase()
  const uuid = payload.uuid || `jemaat-${Date.now()}-${Math.random().toString(16).slice(2)}`

  const result = await db.run(
    `
      INSERT INTO jemaat (
        uuid, keluarga_id, wilayah_id, nama_lengkap, jenis_kelamin, tempat_lahir,
        tanggal_lahir, no_hp, email, alamat, status_jemaat, status_keanggotaan,
        tanggal_baptis, kontak_darurat, foto, catatan, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending');
    `,
    [
      uuid,
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
      payload.photo || DEFAULT_PHOTO,
      payload.notes || '',
    ],
  )

  return getJemaatById(result?.changes?.lastId)
}

export const updateJemaat = async (id, payload) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const current = await getJemaatById(id)
  if (!current) {
    throw new Error('Jemaat not found')
  }

  const wilayahId = payload.wilayah_id || current.wilayahId || (await ensureWilayah(payload))
  const keluargaId = payload.keluarga_id || current.keluargaId || (await ensureKeluarga(payload, wilayahId))

  await db.run(
    `
      UPDATE jemaat
      SET
        keluarga_id = ?,
        wilayah_id = ?,
        nama_lengkap = ?,
        jenis_kelamin = ?,
        tempat_lahir = ?,
        tanggal_lahir = ?,
        no_hp = ?,
        email = ?,
        alamat = ?,
        status_jemaat = ?,
        status_keanggotaan = ?,
        tanggal_baptis = ?,
        kontak_darurat = ?,
        foto = ?,
        catatan = ?,
        updated_at = CURRENT_TIMESTAMP,
        sync_status = 'pending_update'
      WHERE id = ? AND deleted_at IS NULL;
    `,
    [
      keluargaId,
      wilayahId,
      payload.name || payload.fullName || current.fullName,
      payload.gender ?? current.gender,
      payload.birthPlace ?? current.birthPlace,
      payload.birthDate ?? current.birthDate,
      payload.phone ?? current.phone,
      payload.email ?? current.email,
      payload.address ?? current.address,
      payload.status ?? current.status,
      payload.membership ?? current.membership,
      payload.baptismDate ?? current.baptismDate,
      payload.emergencyContact ?? current.emergencyContact,
      payload.photo ?? current.photo,
      payload.notes ?? current.notes,
      id,
    ],
  )

  return getJemaatById(id)
}

export const softDeleteJemaat = async (id) => {
  await ensureDatabaseReady()
  await run(
    `
      UPDATE jemaat
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP,
          sync_status = 'pending_delete'
      WHERE id = ? AND deleted_at IS NULL;
    `,
    [id],
  )
  return true
}

export const insertJemaat = createJemaat

export const getDashboardStats = async () => {
  await ensureDatabaseReady()
  const db = await getDatabase()

  // 1. Total Jemaat
  const totalRes = await db.query("SELECT COUNT(1) AS count FROM jemaat WHERE deleted_at IS NULL;")
  const total = totalRes?.values?.[0]?.count ?? 0

  // 2. Active Jemaat
  const activeRes = await db.query("SELECT COUNT(1) AS count FROM jemaat WHERE deleted_at IS NULL AND status_jemaat = 'Aktif';")
  const active = activeRes?.values?.[0]?.count ?? 0

  // 3. Nonactive Jemaat
  const nonActiveRes = await db.query("SELECT COUNT(1) AS count FROM jemaat WHERE deleted_at IS NULL AND status_jemaat != 'Aktif';")
  const nonActive = nonActiveRes?.values?.[0]?.count ?? 0

  // 4. Total Keluarga
  const keluargaRes = await db.query("SELECT COUNT(1) AS count FROM keluarga WHERE deleted_at IS NULL;")
  const keluarga = keluargaRes?.values?.[0]?.count ?? 0

  // 5. Total Wilayah
  const wilayahRes = await db.query("SELECT COUNT(1) AS count FROM wilayah WHERE deleted_at IS NULL;")
  const wilayah = wilayahRes?.values?.[0]?.count ?? 0

  // 6. Jemaat Baru Bulan Ini
  const newThisMonthRes = await db.query(
    "SELECT COUNT(1) AS count FROM jemaat WHERE deleted_at IS NULL AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now');"
  )
  const newThisMonth = newThisMonthRes?.values?.[0]?.count ?? 0

  // 7. Data Belum Lengkap (Missing No HP, Alamat, Tanggal Lahir)
  const incompleteRes = await db.query(
    `SELECT COUNT(1) AS count FROM jemaat 
     WHERE deleted_at IS NULL AND (
       no_hp IS NULL OR no_hp = '' OR 
       alamat IS NULL OR alamat = '' OR 
       tanggal_lahir IS NULL OR tanggal_lahir = ''
     );`
  )
  const incomplete = incompleteRes?.values?.[0]?.count ?? 0

  return {
    total,
    active,
    nonActive,
    keluarga,
    wilayah,
    newThisMonth,
    incomplete
  }
}
