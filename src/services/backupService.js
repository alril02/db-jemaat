import { ensureDatabaseReady, getDatabase } from 'src/services/sqliteService'

const TABLES = [
  'schema_migrations',
  'roles',
  'users',
  'wilayah',
  'keluarga',
  'jemaat',
  'event_ibadah',
  'presensi_ibadah'
]

// Reverse order of tables for safe deletion (dependent child tables first)
const DELETE_ORDER = [
  'presensi_ibadah',
  'event_ibadah',
  'jemaat',
  'keluarga',
  'wilayah',
  'users',
  'roles',
  'schema_migrations'
]

export const exportDatabaseBackup = async () => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const backup = {
    app: 'db-jemaat',
    backupVersion: 1,
    createdAt: new Date().toISOString(),
    data: {}
  }

  for (const table of TABLES) {
    const result = await db.query(`SELECT * FROM ${table};`)
    backup.data[table] = result?.values ?? []
  }

  return backup
}

export const importDatabaseBackup = async (backup) => {
  // 1. Validation
  if (!backup || backup.app !== 'db-jemaat' || !backup.data) {
    throw new Error('Format file backup tidak valid atau bukan untuk aplikasi DB Jemaat.')
  }

  for (const table of TABLES) {
    if (!Array.isArray(backup.data[table])) {
      throw new Error(`Data tabel ${table} tidak ditemukan atau rusak.`)
    }
  }

  await ensureDatabaseReady()
  const db = await getDatabase()

  // Disable foreign keys temporarily for bulk import
  await db.execute('PRAGMA foreign_keys = OFF;')

  try {
    // 2. Clear all tables in safe order
    for (const table of DELETE_ORDER) {
      await db.run(`DELETE FROM ${table};`)
      // Reset sqlite autoincrement sequence
      await db.run(`DELETE FROM sqlite_sequence WHERE name = ?;`, [table])
    }

    // 3. Re-insert data table by table
    for (const table of TABLES) {
      const rows = backup.data[table]
      if (rows.length === 0) continue

      // Extract columns from the first row
      const columns = Object.keys(rows[0])
      const placeholders = columns.map(() => '?').join(', ')
      const columnNames = columns.join(', ')
      
      const insertSql = `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders});`

      for (const row of rows) {
        const values = columns.map(col => row[col])
        await db.run(insertSql, values)
      }
    }
  } finally {
    // Re-enable foreign keys
    await db.execute('PRAGMA foreign_keys = ON;')
  }

  return true
}
