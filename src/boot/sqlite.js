import { boot } from 'quasar/wrappers'
import { Capacitor } from '@capacitor/core'
import { defineCustomElements } from 'jeep-sqlite/loader'
import { initJemaatDb } from 'src/services/sqliteService'
import { useSessionStore } from 'stores/session'
import { useDbStore } from 'stores/db'

export default boot(({ store }) => {
  const dbStore = useDbStore(store)
  const sessionStore = useSessionStore(store)

  dbStore.setLoading(true)

  if (Capacitor.getPlatform() === 'web') {
    globalThis.JEEP_SQLITE_WASM_PATH =
      'https://cdn.jsdelivr.net/npm/jeep-sqlite@2.8.0/dist/jeep-sqlite.wasm'
    defineCustomElements(window)
    if (!document.querySelector('jeep-sqlite')) {
      const jeep = document.createElement('jeep-sqlite')
      document.body.appendChild(jeep)
    }
  }

  const initDb = async () => {
    try {
      if (Capacitor.getPlatform() === 'web') {
        await customElements.whenDefined('jeep-sqlite')
      }
      await initJemaatDb()
      dbStore.setInitialized(true)
      dbStore.setLoading(false)

      if (!sessionStore.loaded) {
        await sessionStore.bootstrapCurrentUser()
      }
    } catch (e) {
      console.error('Failed to initialize SQLite database', e)
      dbStore.setError(e.message || String(e))
      dbStore.setLoading(false)
    }
  }

  // Run database initialization asynchronously without blocking boot
  initDb()
})
