import { defineStore, acceptHMRUpdate } from 'pinia'
import { getAllKeluarga, createKeluarga, updateKeluarga, softDeleteKeluarga } from 'src/services/keluargaService'

export const useKeluargaStore = defineStore('keluarga', {
  state: () => ({
    listKeluarga: [],
    loading: false,
    error: null,
  }),
  actions: {
    async loadKeluarga() {
      this.loading = true
      this.error = null
      try {
        this.listKeluarga = await getAllKeluarga()
        return this.listKeluarga
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async createKeluarga(payload) {
      this.loading = true
      this.error = null
      try {
        const created = await createKeluarga(payload)
        await this.loadKeluarga()
        return created
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async updateKeluarga(id, payload) {
      this.loading = true
      this.error = null
      try {
        const updated = await updateKeluarga(id, payload)
        await this.loadKeluarga()
        return updated
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async deleteKeluarga(id) {
      this.loading = true
      this.error = null
      try {
        await softDeleteKeluarga(id)
        await this.loadKeluarga()
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
  import.meta.hot.accept(acceptHMRUpdate(useKeluargaStore, import.meta.hot))
}
