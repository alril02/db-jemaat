import { ensureDatabaseReady, getDatabase } from 'src/services/sqliteService'

const sha256 = async (string) => {
  if (string === 'CHANGE_ME') return 'CHANGE_ME'
  const utf8 = new TextEncoder().encode(string)
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((bytes) => bytes.toString(16).padStart(2, '0')).join('')
}

export const loadCurrentUser = async () => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const result = await db.query(
    `
      SELECT
        u.id,
        u.uuid,
        u.nama_lengkap,
        u.username,
        u.status,
        u.password_hash,
        u.pin_hash,
        r.nama_role,
        r.kode_role
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.deleted_at IS NULL
      ORDER BY CASE WHEN u.username = 'admin' THEN 0 ELSE 1 END, u.id ASC
      LIMIT 1;
    `,
  )

  const row = result?.values?.[0]
  if (!row) {
    return null
  }

  return {
    id: row.id,
    uuid: row.uuid,
    fullName: row.nama_lengkap,
    username: row.username,
    status: row.status,
    roleName: row.nama_role,
    roleCode: row.kode_role,
    mustChangeCredential: row.password_hash === 'CHANGE_ME' || row.pin_hash === 'CHANGE_ME',
  }
}

export const verifyPin = async (userId, pin) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const result = await db.query(
    'SELECT pin_hash FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1;',
    [userId]
  )
  const row = result?.values?.[0]
  if (!row) return false

  const hashedInput = await sha256(pin)
  return row.pin_hash === hashedInput
}

export const updateCredentials = async (userId, newPassword, newPin) => {
  await ensureDatabaseReady()
  const db = await getDatabase()
  const passwordHash = await sha256(newPassword)
  const pinHash = await sha256(newPin)

  await db.run(
    `
      UPDATE users
      SET password_hash = ?,
          pin_hash = ?,
          updated_at = CURRENT_TIMESTAMP,
          sync_status = 'pending_update'
      WHERE id = ?;
    `,
    [passwordHash, pinHash, userId]
  )
  return true
}
