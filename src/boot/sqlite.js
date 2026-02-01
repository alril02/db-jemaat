import { boot } from 'quasar/wrappers'
import { Capacitor } from '@capacitor/core'
import { defineCustomElements } from 'jeep-sqlite/loader'
import { initJemaatDb } from 'src/services/sqliteService'

export default boot(async () => {
  if (Capacitor.getPlatform() === 'web') {
    globalThis.JEEP_SQLITE_WASM_PATH =
      'https://cdn.jsdelivr.net/npm/jeep-sqlite@2.8.0/dist/jeep-sqlite.wasm'
    defineCustomElements(window)
    if (!document.querySelector('jeep-sqlite')) {
      const jeep = document.createElement('jeep-sqlite')
      document.body.appendChild(jeep)
    }
  }

  await initJemaatDb()
})
