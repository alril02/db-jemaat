import { ensureDatabaseReady, getDatabase } from 'src/services/sqliteService'

const mapWilayahRow = (row) => ({
  id: row.id,
  uuid: row.uuid,
  nama: row.nama,
  name: row.nama, // alias
  kode: row.kode,
  penanggungJawab: row.penanggung_jawab,
  catatan: row.catatan,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  syncStatus: row.sync_status,
  lastSyncedAt: row.last_synced_at,
})

export const getAllWilayah = async () => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const result = await db.query(
    'SELECT * FROM wilayah WHERE deleted_at IS NULL ORDER BY nama ASC;'
  )
  return (result?.values ?? []).map(mapWilayahRow)
}

export const getWilayahById = async (id) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const result = await db.query(
    'SELECT * FROM wilayah WHERE id = ? AND deleted_at IS NULL LIMIT 1;',
    [id]
  )
  const row = result?.values?.[0]
  return row ? mapWilayahRow(row) : null
}

export const createWilayah = async (payload) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const uuid = payload.uuid || `wilayah-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const code = (payload.kode || payload.nama || 'WIL')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 10) || 'WIL'

  const result = await db.run(
    `
      INSERT INTO wilayah (uuid, nama, kode, penanggung_jawab, catatan, sync_status)
      VALUES (?, ?, ?, ?, ?, 'pending');
    `,
    [
      uuid,
      payload.nama || payload.name || '',
      payload.kode || code,
      payload.penanggungJawab || payload.penanggung_jawab || null,
      payload.catatan || null
    ]
  )
  return getWilayahById(result?.changes?.lastId)
}

export const updateWilayah = async (id, payload) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const code = (payload.kode || payload.nama || 'WIL')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 10) || 'WIL'

  await db.run(
    `
      UPDATE wilayah
      SET nama = ?,
          kode = ?,
          penanggung_jawab = ?,
          catatan = ?,
          updated_at = CURRENT_TIMESTAMP,
          sync_status = 'pending_update'
      WHERE id = ? AND deleted_at IS NULL;
    `,
    [
      payload.nama || payload.name || '',
      payload.kode || code,
      payload.penanggungJawab || payload.penanggung_jawab || null,
      payload.catatan || null,
      id
    ]
  )
  return getWilayahById(id)
}

export const softDeleteWilayah = async (id) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  
  // Check if any active jemaat or keluarga is using this wilayah
  const jemaatCount = await db.query(
    'SELECT COUNT(1) AS count FROM jemaat WHERE wilayah_id = ? AND deleted_at IS NULL;',
    [id]
  )
  const keluargaCount = await db.query(
    'SELECT COUNT(1) AS count FROM keluarga WHERE wilayah_id = ? AND deleted_at IS NULL;',
    [id]
  )

  if ((jemaatCount?.values?.[0]?.count ?? 0) > 0 || (keluargaCount?.values?.[0]?.count ?? 0) > 0) {
    throw new Error('Wilayah tidak dapat dihapus karena masih digunakan oleh Jemaat atau Keluarga.')
  }

  await db.run(
    `
      UPDATE wilayah
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP,
          sync_status = 'pending_delete'
      WHERE id = ? AND deleted_at IS NULL;
    `,
    [id]
  )
  return true
}
