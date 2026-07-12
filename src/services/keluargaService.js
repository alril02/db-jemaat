import { ensureDatabaseReady, getDatabase } from 'src/services/sqliteService'

const mapKeluargaRow = (row) => ({
  id: row.id,
  uuid: row.uuid,
  wilayahId: row.wilayah_id,
  namaWilayah: row.nama_wilayah,
  namaKeluarga: row.nama_keluarga,
  kepalaKeluarga: row.kepala_keluarga,
  alamat: row.alamat,
  noHpKeluarga: row.no_hp_keluarga,
  catatan: row.catatan,
  totalAnggota: row.total_anggota ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  syncStatus: row.sync_status,
  lastSyncedAt: row.last_synced_at,
})

export const getAllKeluarga = async () => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const result = await db.query(
    `
      SELECT k.*, w.nama AS nama_wilayah, COUNT(j.id) AS total_anggota
      FROM keluarga k
      JOIN wilayah w ON w.id = k.wilayah_id
      LEFT JOIN jemaat j ON j.keluarga_id = k.id AND j.deleted_at IS NULL
      WHERE k.deleted_at IS NULL
      GROUP BY k.id
      ORDER BY k.nama_keluarga ASC;
    `
  )
  return (result?.values ?? []).map(mapKeluargaRow)
}

export const getKeluargaById = async (id) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const result = await db.query(
    `
      SELECT k.*, w.nama AS nama_wilayah, (
        SELECT COUNT(1) FROM jemaat WHERE keluarga_id = k.id AND deleted_at IS NULL
      ) AS total_anggota
      FROM keluarga k
      JOIN wilayah w ON w.id = k.wilayah_id
      WHERE k.id = ? AND k.deleted_at IS NULL
      LIMIT 1;
    `,
    [id]
  )
  const row = result?.values?.[0]
  return row ? mapKeluargaRow(row) : null
}

export const getKeluargaByWilayah = async (wilayahId) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const result = await db.query(
    `
      SELECT k.*, w.nama AS nama_wilayah, COUNT(j.id) AS total_anggota
      FROM keluarga k
      JOIN wilayah w ON w.id = k.wilayah_id
      LEFT JOIN jemaat j ON j.keluarga_id = k.id AND j.deleted_at IS NULL
      WHERE k.wilayah_id = ? AND k.deleted_at IS NULL
      GROUP BY k.id
      ORDER BY k.nama_keluarga ASC;
    `,
    [wilayahId]
  )
  return (result?.values ?? []).map(mapKeluargaRow)
}

export const createKeluarga = async (payload) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const uuid = payload.uuid || `keluarga-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const result = await db.run(
    `
      INSERT INTO keluarga (uuid, wilayah_id, nama_keluarga, kepala_keluarga, alamat, no_hp_keluarga, catatan, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending');
    `,
    [
      uuid,
      payload.wilayahId || payload.wilayah_id,
      payload.namaKeluarga || payload.nama_keluarga || '',
      payload.kepalaKeluarga || payload.kepala_keluarga || null,
      payload.alamat || null,
      payload.noHpKeluarga || payload.no_hp_keluarga || null,
      payload.catatan || null
    ]
  )
  return getKeluargaById(result?.changes?.lastId)
}

export const updateKeluarga = async (id, payload) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  await db.run(
    `
      UPDATE keluarga
      SET wilayah_id = ?,
          nama_keluarga = ?,
          kepala_keluarga = ?,
          alamat = ?,
          no_hp_keluarga = ?,
          catatan = ?,
          updated_at = CURRENT_TIMESTAMP,
          sync_status = 'pending_update'
      WHERE id = ? AND deleted_at IS NULL;
    `,
    [
      payload.wilayahId || payload.wilayah_id,
      payload.namaKeluarga || payload.nama_keluarga || '',
      payload.kepalaKeluarga || payload.kepala_keluarga || null,
      payload.alamat || null,
      payload.noHpKeluarga || payload.no_hp_keluarga || null,
      payload.catatan || null,
      id
    ]
  )
  return getKeluargaById(id)
}

export const softDeleteKeluarga = async (id) => {
  await ensureDatabaseReady()
  const db = await getDatabase()

  // Verify no active jemaat are in this family
  const jemaatCount = await db.query(
    'SELECT COUNT(1) AS count FROM jemaat WHERE keluarga_id = ? AND deleted_at IS NULL;',
    [id]
  )

  if ((jemaatCount?.values?.[0]?.count ?? 0) > 0) {
    throw new Error('Keluarga tidak dapat dihapus karena masih memiliki anggota Jemaat aktif.')
  }

  await db.run(
    `
      UPDATE keluarga
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP,
          sync_status = 'pending_delete'
      WHERE id = ? AND deleted_at IS NULL;
    `,
    [id]
  )
  return true
}
