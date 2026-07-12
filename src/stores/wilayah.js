import { defineStore, acceptHMRUpdate } from 'pinia'
import { getAllWilayah, createWilayah, updateWilayah, softDeleteWilayah } from 'src/services/wilayahService'

export const useWilayahStore = defineStore('wilayah', {
  state: () => ({
    listWilayah: [],
    loading: false,
    error: null,
  }),
  actions: {
    async loadWilayah() {
      this.loading = true
      this.error = null
      try {
        this.listWilayah = await getAllWilayah()
        return this.listWilayah
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async createWilayah(payload) {
      this.loading = true
      this.error = null
      try {
        const created = await createWilayah(payload)
        await this.loadWilayah()
        return created
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async updateWilayah(id, payload) {
      this.loading = true
      this.error = null
      try {
        const updated = await updateWilayah(id, payload)
        await this.loadWilayah()
        return updated
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async deleteWilayah(id) {
      this.loading = true
      this.error = null
      try {
        await softDeleteWilayah(id)
        await this.loadWilayah()
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWilayahStore, import.meta.hot))
}
