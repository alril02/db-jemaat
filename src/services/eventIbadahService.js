import { ensureDatabaseReady, getDatabase } from 'src/services/sqliteService'
import { loadCurrentUser } from 'src/services/sessionService'

const mapEventRow = (row) => ({
  id: row.id,
  uuid: row.uuid,
  createdByUserId: row.created_by_user_id,
  namaEvent: row.nama_event,
  jenisEvent: row.jenis_event,
  tanggal: row.tanggal,
  jamMulai: row.jam_mulai,
  jamSelesai: row.jam_selesai,
  lokasi: row.lokasi,
  status: row.status,
  catatan: row.catatan,
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

export const createEventIbadah = async (payload) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const currentUser = payload.createdByUserId ? { id: payload.createdByUserId } : await loadCurrentUser()
  const uuid = payload.uuid || `event-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const result = await db.run(
    `
      INSERT INTO event_ibadah (
        uuid, created_by_user_id, nama_event, jenis_event, tanggal,
        jam_mulai, jam_selesai, lokasi, status, catatan, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, 'pending');
    `,
    [
      uuid,
      currentUser?.id,
      payload.namaEvent || payload.nama_event || '',
      payload.jenisEvent || payload.jenis_event || '',
      payload.tanggal || '',
      payload.jamMulai || payload.jam_mulai || '',
      payload.jamSelesai || payload.jam_selesai || '',
      payload.lokasi || '',
      payload.catatan || '',
    ],
  )

  return getEventById(result?.changes?.lastId)
}

export const getTodayEvents = async () => {
  await ensureDatabaseReady()
  const rows = await queryMany(
    `
      SELECT * FROM event_ibadah
      WHERE deleted_at IS NULL AND tanggal = date('now')
      ORDER BY COALESCE(jam_mulai, '') ASC, id DESC;
    `,
  )
  return rows.map(mapEventRow)
}

export const getEventById = async (id) => {
  await ensureDatabaseReady()
  const row = await queryOne('SELECT * FROM event_ibadah WHERE id = ? AND deleted_at IS NULL LIMIT 1;', [id])
  return row ? mapEventRow(row) : null
}

const updateStatus = async (id, status) => {
  const db = await getDatabase()
  await db.run(
    `
      UPDATE event_ibadah
      SET status = ?, updated_at = CURRENT_TIMESTAMP, sync_status = 'pending_update'
      WHERE id = ? AND deleted_at IS NULL;
    `,
    [status, id],
  )
  return getEventById(id)
}

export const startEvent = async (id) => updateStatus(id, 'active')

export const finishEvent = async (id) => updateStatus(id, 'finished')

export const cancelEvent = async (id) => updateStatus(id, 'cancelled')

export const getAllEventIbadah = async () => {
  await ensureDatabaseReady()
  const rows = await queryMany(
    `
      SELECT * FROM event_ibadah
      WHERE deleted_at IS NULL
      ORDER BY tanggal DESC, jam_mulai DESC, id DESC;
    `,
  )
  return rows.map(mapEventRow)
}

export const updateEventIbadah = async (id, payload) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  await db.run(
    `
      UPDATE event_ibadah
      SET nama_event = ?,
          jenis_event = ?,
          tanggal = ?,
          jam_mulai = ?,
          jam_selesai = ?,
          lokasi = ?,
          catatan = ?,
          updated_at = CURRENT_TIMESTAMP,
          sync_status = 'pending_update'
      WHERE id = ? AND deleted_at IS NULL;
    `,
    [
      payload.namaEvent || payload.nama_event || '',
      payload.jenisEvent || payload.jenis_event || '',
      payload.tanggal || '',
      payload.jamMulai || payload.jam_mulai || '',
      payload.jamSelesai || payload.jam_selesai || '',
      payload.lokasi || '',
      payload.catatan || '',
      id
    ]
  )
  return getEventById(id)
}

export const deleteEventIbadah = async (id) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  await db.run(
    `
      UPDATE event_ibadah
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP,
          sync_status = 'pending_delete'
      WHERE id = ? AND deleted_at IS NULL;
    `,
    [id]
  )
  return true
}
