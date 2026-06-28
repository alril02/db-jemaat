import test from 'node:test'
import assert from 'node:assert/strict'
import { createTestDatabase } from '../../database/test-db.js'
import { runMigrations } from '../../database/migrations.js'

test('creates all required tables', async () => {
  const db = await createTestDatabase()
  await runMigrations(db)

  const tables = await db.query("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;")
  const names = tables.values.map((row) => row.name).filter((name) => name !== 'sqlite_sequence')

  for (const tableName of [
    'schema_migrations',
    'roles',
    'users',
    'wilayah',
    'keluarga',
    'jemaat',
    'event_ibadah',
    'presensi_ibadah',
  ]) {
    assert.ok(names.includes(tableName), `expected ${tableName} to exist`)
  }
})
