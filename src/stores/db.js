import { defineStore, acceptHMRUpdate } from 'pinia'

export const useDbStore = defineStore('db', {
  state: () => ({
    initialized: false,
    loading: false,
    error: null,
    isFallback: false,
  }),
  actions: {
    setLoading(status) {
      this.loading = status
    },
    setInitialized(status) {
      this.initialized = status
    },
    setError(err) {
      this.error = err
    },
    setFallback(status) {
      this.isFallback = status
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDbStore, import.meta.hot))
}
