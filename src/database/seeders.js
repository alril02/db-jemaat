import {
  DEFAULT_ADMIN_USER,
  DEFAULT_DEMO_JEMAAT,
  DEFAULT_DEMO_KELUARGA,
  DEFAULT_DEMO_WILAYAH,
  DEFAULT_ROLES,
} from './schema.js'

const insertIfMissing = async (db, table, keyColumn, keyValue, columns, values) => {
  const existing = await db.query(`SELECT 1 AS found FROM ${table} WHERE ${keyColumn} = ? LIMIT 1;`, [
    keyValue,
  ])

  if ((existing?.values?.length ?? 0) > 0) {
    return false
  }

  const placeholders = columns.map(() => '?').join(', ')
  const columnList = columns.join(', ')
  await db.run(`INSERT INTO ${table} (${columnList}) VALUES (${placeholders});`, values)
  return true
}

export const seedRoles = async (db) => {
  let inserted = 0
  for (const role of DEFAULT_ROLES) {
    const didInsert = await insertIfMissing(
      db,
      'roles',
      'kode_role',
      role.kode_role,
      ['uuid', 'nama_role', 'kode_role', 'deskripsi'],
      [role.uuid, role.nama_role, role.kode_role, role.deskripsi],
    )
    if (didInsert) inserted += 1
  }
  return inserted
}

export const seedDefaultAdmin = async (db) => {
  const role = await db.query('SELECT id FROM roles WHERE kode_role = ? LIMIT 1;', ['admin'])
  const roleId = role?.values?.[0]?.id
  if (!roleId) {
    throw new Error('Admin role must exist before seeding default admin user')
  }

  const didInsert = await insertIfMissing(
    db,
    'users',
    'username',
    DEFAULT_ADMIN_USER.username,
    [
      'uuid',
      'role_id',
      'nama_lengkap',
      'username',
      'password_hash',
      'pin_hash',
      'no_hp',
      'email',
      'status',
      'sync_status',
    ],
    [
      DEFAULT_ADMIN_USER.uuid,
      roleId,
      DEFAULT_ADMIN_USER.nama_lengkap,
      DEFAULT_ADMIN_USER.username,
      DEFAULT_ADMIN_USER.password_hash,
      DEFAULT_ADMIN_USER.pin_hash,
      DEFAULT_ADMIN_USER.no_hp,
      DEFAULT_ADMIN_USER.email,
      DEFAULT_ADMIN_USER.status,
      DEFAULT_ADMIN_USER.sync_status,
    ],
  )

  return didInsert ? 1 : 0
}

const seedDemoWilayah = async (db) => {
  let inserted = 0
  for (const item of DEFAULT_DEMO_WILAYAH) {
    const didInsert = await insertIfMissing(
      db,
      'wilayah',
      'kode',
      item.kode,
      ['uuid', 'nama', 'kode', 'penanggung_jawab', 'catatan'],
      [item.uuid, item.nama, item.kode, item.penanggung_jawab, item.catatan],
    )
    if (didInsert) inserted += 1
  }
  return inserted
}

const seedDemoKeluarga = async (db) => {
  let inserted = 0
  for (const item of DEFAULT_DEMO_KELUARGA) {
    const wilayah = await db.query('SELECT id FROM wilayah WHERE uuid = ? LIMIT 1;', [item.wilayah_uuid])
    const wilayahId = wilayah?.values?.[0]?.id
    if (!wilayahId) continue

    const didInsert = await insertIfMissing(
      db,
      'keluarga',
      'uuid',
      item.uuid,
      ['uuid', 'wilayah_id', 'nama_keluarga', 'kepala_keluarga', 'alamat', 'no_hp_keluarga', 'catatan'],
      [item.uuid, wilayahId, item.nama_keluarga, item.kepala_keluarga, item.alamat, item.no_hp_keluarga, item.catatan],
    )
    if (didInsert) inserted += 1
  }
  return inserted
}

const seedDemoJemaat = async (db) => {
  let inserted = 0
  for (const item of DEFAULT_DEMO_JEMAAT) {
    const wilayah = await db.query('SELECT id FROM wilayah WHERE uuid = ? LIMIT 1;', [item.wilayah_uuid])
    const keluarga = await db.query('SELECT id FROM keluarga WHERE uuid = ? LIMIT 1;', [item.keluarga_uuid])
    const wilayahId = wilayah?.values?.[0]?.id
    const keluargaId = keluarga?.values?.[0]?.id
    if (!wilayahId || !keluargaId) continue

    const didInsert = await insertIfMissing(
      db,
      'jemaat',
      'uuid',
      item.uuid,
      [
        'uuid',
        'keluarga_id',
        'wilayah_id',
        'nama_lengkap',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'no_hp',
        'email',
        'alamat',
        'status_jemaat',
        'status_keanggotaan',
        'tanggal_baptis',
        'kontak_darurat',
        'foto',
        'catatan',
      ],
      [
        item.uuid,
        keluargaId,
        wilayahId,
        item.nama_lengkap,
        item.jenis_kelamin,
        item.tempat_lahir,
        item.tanggal_lahir,
        item.no_hp,
        item.email,
        item.alamat,
        item.status_jemaat,
        item.status_keanggotaan,
        item.tanggal_baptis,
        item.kontak_darurat,
        item.foto,
        item.catatan,
      ],
    )
    if (didInsert) inserted += 1
  }
  return inserted
}

export const runSeeders = async (db, { includeDemoData = true } = {}) => {
  const seededRoles = await seedRoles(db)
  const seededAdmin = await seedDefaultAdmin(db)

  let seededDemo = 0
  if (includeDemoData) {
    seededDemo += await seedDemoWilayah(db)
    seededDemo += await seedDemoKeluarga(db)
    seededDemo += await seedDemoJemaat(db)
  }

  return {
    roles: seededRoles,
    adminUsers: seededAdmin,
    demoRows: seededDemo,
  }
}

