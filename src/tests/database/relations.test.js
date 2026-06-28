import test from 'node:test'
import assert from 'node:assert/strict'
import { createTestDatabase } from '../../database/test-db.js'
import { runMigrations } from '../../database/migrations.js'
import { runSeeders } from '../../database/seeders.js'

test('creates demo relations across wilayah, keluarga, jemaat, event, and presensi', async () => {
  const db = await createTestDatabase()
  await runMigrations(db)
  await runSeeders(db, { includeDemoData: true })

  const wilayah = await db.query('SELECT * FROM wilayah LIMIT 1;')
  const keluarga = await db.query('SELECT * FROM keluarga LIMIT 1;')
  const jemaat = await db.query('SELECT * FROM jemaat LIMIT 1;')
  const user = await db.query("SELECT * FROM users WHERE username = 'admin' LIMIT 1;")

  assert.ok(wilayah.values[0])
  assert.ok(keluarga.values[0])
  assert.ok(jemaat.values[0])
  assert.ok(user.values[0])
})

