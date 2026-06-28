import test from 'node:test'
import assert from 'node:assert/strict'
import { createTestDatabase } from '../../database/test-db.js'
import { runMigrations } from '../../database/migrations.js'
import { runSeeders } from '../../database/seeders.js'

const getCount = async (db, table) => {
  const result = await db.query(`SELECT COUNT(1) AS total FROM ${table};`)
  return result.values[0].total
}

test('seeds default roles and admin user once', async () => {
  const db = await createTestDatabase()
  await runMigrations(db)

  const first = await runSeeders(db, { includeDemoData: false })
  const second = await runSeeders(db, { includeDemoData: false })

  assert.equal(first.roles, 3)
  assert.equal(first.adminUsers, 1)
  assert.equal(second.roles, 0)
  assert.equal(second.adminUsers, 0)
  assert.equal(await getCount(db, 'roles'), 3)
  assert.equal(await getCount(db, 'users'), 1)
})

