import { defineStore, acceptHMRUpdate } from 'pinia'
import { cancelPresensi, getPresensiByEvent, getRekapByWilayah, getTotalHadir, markHadir } from 'src/services/presensiIbadahService'

export const usePresensiIbadahStore = defineStore('presensiIbadah', {
  state: () => ({
    currentEventId: null,
    listPresensi: [],
    rekapWilayah: [],
    totalHadir: 0,
    selectedWilayah: null,
    loading: false,
    error: null,
  }),
  actions: {
    async loadByEvent(eventId) {
      this.loading = true
      this.error = null
      this.currentEventId = eventId
      try {
        this.listPresensi = await getPresensiByEvent(eventId)
        this.totalHadir = await getTotalHadir(eventId)
        return this.listPresensi
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async loadRekapByWilayah(eventId) {
      this.loading = true
      this.error = null
      try {
        this.rekapWilayah = await getRekapByWilayah(eventId)
        return this.rekapWilayah
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async markHadir(eventId, jemaatId, userId) {
      this.loading = true
      this.error = null
      try {
        const result = await markHadir(eventId, jemaatId, userId)
        await this.loadByEvent(eventId)
        return result
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async cancelPresensi(eventId, jemaatId) {
      this.loading = true
      this.error = null
      try {
        const result = await cancelPresensi(eventId, jemaatId)
        await this.loadByEvent(eventId)
        return result
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    setSelectedWilayah(wilayah) {
      this.selectedWilayah = wilayah
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePresensiIbadahStore, import.meta.hot))
}
