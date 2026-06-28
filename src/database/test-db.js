import initSqlJs from 'sql.js/dist/sql-wasm.js'
import { fileURLToPath } from 'node:url'

const wasmPath = fileURLToPath(new URL('../../node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url))

const toRows = (stmt) => {
  const columns = stmt.getColumnNames()
  const rows = []
  while (stmt.step()) {
    const values = stmt.get()
    rows.push(Object.fromEntries(columns.map((column, index) => [column, values[index]])))
  }
  return rows
}

export const createTestDatabase = async () => {
  const SQL = await initSqlJs({
    locateFile: () => wasmPath,
  })

  const database = new SQL.Database()
  database.exec('PRAGMA foreign_keys = ON;')

  return {
    execute: async (sql) => {
      database.exec(sql)
    },
    run: async (sql, params = []) => {
      const statement = database.prepare(sql)
      try {
        statement.bind(params)
        while (statement.step()) {
          // no-op, run only
        }
      } finally {
        statement.free()
      }

      return {
        changes: {
          lastId: database.exec('SELECT last_insert_rowid() AS lastId;')[0]?.values?.[0]?.[0] ?? 0,
        },
      }
    },
    query: async (sql, params = []) => {
      const statement = database.prepare(sql)
      try {
        statement.bind(params)
        return { values: toRows(statement) }
      } finally {
        statement.free()
      }
    },
    close: async () => {
      database.close()
    },
    raw: database,
  }
}
