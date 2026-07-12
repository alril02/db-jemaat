import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'
import { runMigrations } from 'src/database/migrations'
import { runSeeders } from 'src/database/seeders'

const DB_NAME = 'jemaat_db'
const DB_VERSION = 2
let sqlite
let db
let webStoreInitialized = false

const getConnection = async () => {
  if (!sqlite) {
    sqlite = new SQLiteConnection(CapacitorSQLite)
  }

  if (Capacitor.getPlatform() === 'web' && !webStoreInitialized) {
    await sqlite.initWebStore()
    webStoreInitialized = true
  }

  if (!db) {
    db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false)
    await db.open()
    await db.execute('PRAGMA foreign_keys = ON;')
  }

  return db
}

let initPromise = null

const ensureDatabaseReady = async () => {
  if (!initPromise) {
    initPromise = (async () => {
      const connection = await getConnection()
      await runMigrations(connection)
      await runSeeders(connection, { includeDemoData: true })
      return connection
    })()
  }
  return initPromise
}

export const initJemaatDb = async () => {
  if (Capacitor.getPlatform() === 'web') {
    await customElements.whenDefined('jeep-sqlite')
  }

  await ensureDatabaseReady()
}

export { getConnection as getDatabase, ensureDatabaseReady }
