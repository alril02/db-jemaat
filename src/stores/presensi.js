import { defineStore, acceptHMRUpdate } from 'pinia'
import {
  getPresensiByEvent,
  markHadir,
  cancelPresensi,
  getTotalHadir,
  getRekapByWilayah
} from 'src/services/presensiIbadahService'

export const usePresensiStore = defineStore('presensi', {
  state: () => ({
    listPresensi: [],
    totalHadir: 0,
    rekapWilayah: [],
    loading: false,
    error: null
  }),
  actions: {
    async loadPresensi(eventId) {
      this.loading = true
      this.error = null
      try {
        const [presensi, total, rekap] = await Promise.all([
          getPresensiByEvent(eventId),
          getTotalHadir(eventId),
          getRekapByWilayah(eventId)
        ])
        this.listPresensi = presensi || []
        this.totalHadir = total || 0
        this.rekapWilayah = rekap || []
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async checkIn(eventId, jemaatId, userId, metode = 'search') {
      this.error = null
      try {
        const result = await markHadir(eventId, jemaatId, userId, { metode })
        if (result && result.alreadyExists) {
          return { success: false, message: 'Jemaat sudah terdaftar hadir.' }
        }
        await this.loadPresensi(eventId)
        return { success: true }
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      }
    },
    async checkOut(eventId, jemaatId) {
      this.error = null
      try {
        await cancelPresensi(eventId, jemaatId)
        await this.loadPresensi(eventId)
        return { success: true }
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      }
    }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePresensiStore, import.meta.hot))
}
