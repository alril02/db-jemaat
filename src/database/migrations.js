import { CREATE_SCHEMA, INITIAL_SCHEMA_VERSION } from './schema.js'

const hasTable = async (db, tableName) => {
  const result = await db.query(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1;",
    [tableName],
  )
  return (result?.values?.length ?? 0) > 0
}

const hasColumn = async (db, tableName, columnName) => {
  if (!(await hasTable(db, tableName))) {
    return false
  }

  const result = await db.query(`PRAGMA table_info(${tableName});`)
  return (result?.values ?? []).some((column) => column.name === columnName)
}

const createFreshSchema = async (db) => {
  for (const statement of CREATE_SCHEMA.slice(1)) {
    await db.execute(statement)
  }
}

const normalizeLegacyCode = (value) =>
  (value || 'LEGACY')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 12) || 'LEGACY'

const migrateLegacyJemaatRows = async (db) => {
  const rows = await db.query('SELECT * FROM jemaat_legacy ORDER BY id ASC;')

  for (const row of rows?.values ?? []) {
    const wilayahName = row.area || 'Wilayah Umum'
    const wilayahCode = normalizeLegacyCode(wilayahName)
    const wilayahResult = await db.query('SELECT id FROM wilayah WHERE kode = ? LIMIT 1;', [wilayahCode])

    let wilayahId = wilayahResult?.values?.[0]?.id
    if (!wilayahId) {
      const insertWilayah = await db.run(
        'INSERT INTO wilayah (uuid, nama, kode, penanggung_jawab, catatan) VALUES (?, ?, ?, ?, ?);',
        [
          `wilayah-legacy-${wilayahCode.toLowerCase()}`,
          wilayahName,
          wilayahCode,
          row.name || null,
          'Migrated from legacy jemaat table',
        ],
      )
      wilayahId = insertWilayah?.changes?.lastId
    }

    const familyName = row.family || row.name || 'Keluarga Legacy'
    const keluargaUuid = `keluarga-legacy-${normalizeLegacyCode(`${wilayahCode}-${familyName}`)}`.toLowerCase()
    const keluargaResult = await db.query('SELECT id FROM keluarga WHERE uuid = ? LIMIT 1;', [keluargaUuid])

    let keluargaId = keluargaResult?.values?.[0]?.id
    if (!keluargaId) {
      const insertKeluarga = await db.run(
        `
          INSERT INTO keluarga (
            uuid, wilayah_id, nama_keluarga, kepala_keluarga, alamat, no_hp_keluarga, catatan
          ) VALUES (?, ?, ?, ?, ?, ?, ?);
        `,
        [
          keluargaUuid,
          wilayahId,
          familyName,
          row.name || null,
          row.address || null,
          row.phone || null,
          'Migrated from legacy jemaat table',
        ],
      )
      keluargaId = insertKeluarga?.changes?.lastId
    }

    await db.run(
      `
        INSERT INTO jemaat (
          uuid, keluarga_id, wilayah_id, nama_lengkap, jenis_kelamin, tempat_lahir,
          tanggal_lahir, no_hp, email, alamat, status_jemaat, status_keanggotaan,
          tanggal_baptis, kontak_darurat, foto, catatan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        `jemaat-legacy-${row.id}`,
        keluargaId,
        wilayahId,
        row.name || '',
        row.gender || '',
        row.birthPlace || '',
        row.birthDate || '',
        row.phone || '',
        row.email || '',
        row.address || '',
        row.status || 'Aktif',
        row.membership || 'Anggota',
        row.baptismDate || '',
        row.emergencyContact || '',
        row.photo || 'https://cdn.quasar.dev/img/avatar1.jpg',
        row.notes || '',
      ],
    )
  }
}

export const ensureMigrationsTable = async (db) => {
  await db.execute(CREATE_SCHEMA[0])
}

export const hasMigrationRun = async (db, version = INITIAL_SCHEMA_VERSION) => {
  const result = await db.query(
    'SELECT 1 AS found FROM schema_migrations WHERE version = ? LIMIT 1;',
    [version],
  )
  return (result?.values?.length ?? 0) > 0
}

export const markMigrationAsRun = async (db, version = INITIAL_SCHEMA_VERSION) => {
  await db.run(
    'INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, CURRENT_TIMESTAMP);',
    [version],
  )
}

const MIGRATIONS = [
  {
    version: INITIAL_SCHEMA_VERSION,
    run: async (db) => {
      const legacyJemaatSchema = (await hasTable(db, 'jemaat')) && !(await hasColumn(db, 'jemaat', 'uuid'))
      if (legacyJemaatSchema) {
        await db.execute('ALTER TABLE jemaat RENAME TO jemaat_legacy;')
      }
      await createFreshSchema(db)
      if (legacyJemaatSchema) {
        await migrateLegacyJemaatRows(db)
      }
    },
  },
  {
    version: '002_add_last_synced_at',
    run: async (db) => {
      const tables = ['roles', 'users', 'wilayah', 'keluarga', 'jemaat', 'event_ibadah', 'presensi_ibadah']
      for (const table of tables) {
        if (!(await hasColumn(db, table, 'last_synced_at'))) {
          await db.execute(`ALTER TABLE ${table} ADD COLUMN last_synced_at TEXT;`)
        }
      }
    },
  },
]

export const runMigrations = async (db) => {
  await ensureMigrationsTable(db)

  let migratedAny = false
  let lastApplied = ''

  for (const migration of MIGRATIONS) {
    const alreadyRun = await hasMigrationRun(db, migration.version)
    if (!alreadyRun) {
      console.log(`Running database migration: ${migration.version}`)
      await migration.run(db)
      await markMigrationAsRun(db, migration.version)
      migratedAny = true
      lastApplied = migration.version
    }
  }

  return { migrated: migratedAny, version: lastApplied || 'up-to-date' }
}
