import { ensureDatabaseReady, getDatabase } from 'src/services/sqliteService'
import { loadCurrentUser } from 'src/services/sessionService'

const mapPresensiRow = (row) => ({
  id: row.id,
  uuid: row.uuid,
  eventIbadahId: row.event_ibadah_id,
  jemaatId: row.jemaat_id,
  recordedByUserId: row.recorded_by_user_id,
  statusPresensi: row.status_presensi,
  waktuPresensi: row.waktu_presensi,
  metodePresensi: row.metode_presensi,
  catatan: row.catatan,
  namaJemaat: row.nama_lengkap,
  wilayah: row.wilayah,
  namaEvent: row.nama_event,
})

const queryMany = async (sql, params = []) => {
  const db = await getDatabase()
  const result = await db.query(sql, params)
  return result?.values ?? []
}

const queryOne = async (sql, params = []) => {
  const db = await getDatabase()
  const result = await db.query(sql, params)
  return result?.values?.[0] ?? null
}

export const getPresensiByEvent = async (eventId) => {
  await ensureDatabaseReady()
  const rows = await queryMany(
    `
      SELECT
        p.*,
        j.nama_lengkap,
        w.nama AS wilayah,
        e.nama_event
      FROM presensi_ibadah p
      JOIN jemaat j ON j.id = p.jemaat_id
      JOIN wilayah w ON w.id = j.wilayah_id
      JOIN event_ibadah e ON e.id = p.event_ibadah_id
      WHERE p.event_ibadah_id = ? AND p.deleted_at IS NULL
      ORDER BY p.waktu_presensi DESC, p.id DESC;
    `,
    [eventId],
  )
  return rows.map(mapPresensiRow)
}

export const markHadir = async (eventId, jemaatId, userId) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const currentUser = userId ? { id: userId } : await loadCurrentUser()

  const event = await queryOne('SELECT id, status FROM event_ibadah WHERE id = ? AND deleted_at IS NULL LIMIT 1;', [
    eventId,
  ])
  if (!event) {
    throw new Error('Event ibadah tidak ditemukan')
  }
  if (event.status !== 'active') {
    throw new Error('Presensi hanya bisa dicatat untuk event aktif')
  }

  const existing = await queryOne(
    'SELECT id FROM presensi_ibadah WHERE event_ibadah_id = ? AND jemaat_id = ? AND deleted_at IS NULL LIMIT 1;',
    [eventId, jemaatId],
  )
  if (existing) {
    return { created: false, alreadyExists: true }
  }

  const result = await db.run(
    `
      INSERT INTO presensi_ibadah (
        uuid, event_ibadah_id, jemaat_id, recorded_by_user_id,
        status_presensi, metode_presensi, sync_status
      ) VALUES (?, ?, ?, ?, 'hadir', 'manual', 'pending');
    `,
    [`presensi-${eventId}-${jemaatId}-${Date.now()}`, eventId, jemaatId, currentUser?.id],
  )

  return {
    created: true,
    id: result?.changes?.lastId ?? null,
  }
}

export const cancelPresensi = async (eventId, jemaatId) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  await db.run(
    `
      UPDATE presensi_ibadah
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP,
          sync_status = 'pending_delete'
      WHERE event_ibadah_id = ? AND jemaat_id = ? AND deleted_at IS NULL;
    `,
    [eventId, jemaatId],
  )
  return true
}

export const getTotalHadir = async (eventId) => {
  await ensureDatabaseReady()
  const row = await queryOne(
    `
      SELECT COUNT(1) AS total
      FROM presensi_ibadah
      WHERE event_ibadah_id = ? AND status_presensi = 'hadir' AND deleted_at IS NULL;
    `,
    [eventId],
  )
  return row?.total ?? 0
}

export const getRekapByWilayah = async (eventId) => {
  await ensureDatabaseReady()
  const rows = await queryMany(
    `
      SELECT
        w.id AS wilayah_id,
        w.nama AS wilayah,
        COUNT(p.id) AS total_presensi,
        SUM(CASE WHEN p.status_presensi = 'hadir' THEN 1 ELSE 0 END) AS total_hadir
      FROM presensi_ibadah p
      JOIN jemaat j ON j.id = p.jemaat_id
      JOIN wilayah w ON w.id = j.wilayah_id
      WHERE p.event_ibadah_id = ? AND p.deleted_at IS NULL
      GROUP BY w.id, w.nama
      ORDER BY w.nama ASC;
    `,
    [eventId],
  )

  return rows.map((row) => ({
    wilayahId: row.wilayah_id,
    wilayah: row.wilayah,
    totalPresensi: row.total_presensi,
    totalHadir: row.total_hadir,
  }))
}

export const isJemaatAlreadyPresent = async (eventId, jemaatId) => {
  await ensureDatabaseReady()
  const row = await queryOne(
    'SELECT 1 AS found FROM presensi_ibadah WHERE event_ibadah_id = ? AND jemaat_id = ? AND deleted_at IS NULL LIMIT 1;',
    [eventId, jemaatId]
  )
  return !!row
}
