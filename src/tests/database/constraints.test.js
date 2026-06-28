import test from 'node:test'
import assert from 'node:assert/strict'
import { createTestDatabase } from '../../database/test-db.js'
import { runMigrations } from '../../database/migrations.js'
import { runSeeders } from '../../database/seeders.js'

const setup = async () => {
  const db = await createTestDatabase()
  await runMigrations(db)
  await runSeeders(db, { includeDemoData: true })
  return db
}

test('rejects duplicate role uuid and kode_role', async () => {
  const db = await setup()
  await assert.rejects(
    db.run(
      'INSERT INTO roles (uuid, nama_role, kode_role, deskripsi) VALUES (?, ?, ?, ?);',
      ['role-admin', 'Admin Duplikat', 'admin-duplikat', 'x'],
    ),
  )
  await assert.rejects(
    db.run(
      'INSERT INTO roles (uuid, nama_role, kode_role, deskripsi) VALUES (?, ?, ?, ?);',
      ['role-new', 'Admin Duplikat', 'admin', 'x'],
    ),
  )
})

test('rejects duplicate username', async () => {
  const db = await setup()
  await assert.rejects(
    db.run(
      'INSERT INTO users (uuid, role_id, nama_lengkap, username, password_hash, pin_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?);',
      ['user-new', 1, 'User Baru', 'admin', 'hash', 'pin', 'active'],
    ),
  )
})

test('rejects duplicate attendance for the same event and jemaat', async () => {
  const db = await setup()
  const userId = (await db.query("SELECT id FROM users WHERE username = 'admin' LIMIT 1;")).values[0].id
  const jemaatId = (await db.query("SELECT id FROM jemaat LIMIT 1;")).values[0].id

  const eventResult = await db.run(
    'INSERT INTO event_ibadah (uuid, created_by_user_id, nama_event, jenis_event, tanggal, status) VALUES (?, ?, ?, ?, ?, ?);',
    ['event-1', userId, 'Ibadah Minggu', 'Minggu', '2026-06-28', 'active'],
  )
  const eventId = eventResult.changes.lastId

  await db.run(
    'INSERT INTO presensi_ibadah (uuid, event_ibadah_id, jemaat_id, recorded_by_user_id, status_presensi) VALUES (?, ?, ?, ?, ?);',
    ['presensi-1', eventId, jemaatId, userId, 'hadir'],
  )

  await assert.rejects(
    db.run(
      'INSERT INTO presensi_ibadah (uuid, event_ibadah_id, jemaat_id, recorded_by_user_id, status_presensi) VALUES (?, ?, ?, ?, ?);',
      ['presensi-2', eventId, jemaatId, userId, 'hadir'],
    ),
  )
})

test('allows same jemaat to attend different events', async () => {
  const db = await setup()
  const userId = (await db.query("SELECT id FROM users WHERE username = 'admin' LIMIT 1;")).values[0].id
  const jemaatId = (await db.query('SELECT id FROM jemaat LIMIT 1;')).values[0].id

  const eventOne = await db.run(
    'INSERT INTO event_ibadah (uuid, created_by_user_id, nama_event, jenis_event, tanggal, status) VALUES (?, ?, ?, ?, ?, ?);',
    ['event-a', userId, 'Ibadah 1', 'Minggu', '2026-06-28', 'active'],
  )
  const eventTwo = await db.run(
    'INSERT INTO event_ibadah (uuid, created_by_user_id, nama_event, jenis_event, tanggal, status) VALUES (?, ?, ?, ?, ?, ?);',
    ['event-b', userId, 'Ibadah 2', 'Minggu', '2026-07-05', 'active'],
  )

  await db.run(
    'INSERT INTO presensi_ibadah (uuid, event_ibadah_id, jemaat_id, recorded_by_user_id, status_presensi) VALUES (?, ?, ?, ?, ?);',
    ['presensi-a', eventOne.changes.lastId, jemaatId, userId, 'hadir'],
  )
  await db.run(
    'INSERT INTO presensi_ibadah (uuid, event_ibadah_id, jemaat_id, recorded_by_user_id, status_presensi) VALUES (?, ?, ?, ?, ?);',
    ['presensi-b', eventTwo.changes.lastId, jemaatId, userId, 'hadir'],
  )
})

test('rejects presensi with invalid foreign keys', async () => {
  const db = await setup()
  await assert.rejects(
    db.run(
      'INSERT INTO presensi_ibadah (uuid, event_ibadah_id, jemaat_id, recorded_by_user_id, status_presensi) VALUES (?, ?, ?, ?, ?);',
      ['presensi-invalid', 9999, 9999, 9999, 'hadir'],
    ),
  )
})
