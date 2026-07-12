import { defineStore, acceptHMRUpdate } from 'pinia'
import { cancelEvent, createEventIbadah, finishEvent, getEventById, getTodayEvents, startEvent } from 'src/services/eventIbadahService'

export const useEventIbadahStore = defineStore('eventIbadah', {
  state: () => ({
    listEvent: [],
    selectedEvent: null,
    loading: false,
    error: null,
  }),
  getters: {
    activeEvents: (state) => state.listEvent.filter((event) => event.status === 'active'),
  },
  actions: {
    async loadTodayEvents() {
      this.loading = true
      this.error = null
      try {
        this.listEvent = await getTodayEvents()
        return this.listEvent
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async createEvent(payload) {
      this.loading = true
      this.error = null
      try {
        const event = await createEventIbadah(payload)
        await this.loadTodayEvents()
        return event
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async selectEvent(id) {
      this.selectedEvent = await getEventById(id)
      return this.selectedEvent
    },
    async startEvent(id) {
      const event = await startEvent(id)
      await this.loadTodayEvents()
      return event
    },
    async finishEvent(id) {
      const event = await finishEvent(id)
      await this.loadTodayEvents()
      return event
    },
    async cancelEvent(id) {
      const event = await cancelEvent(id)
      await this.loadTodayEvents()
      return event
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEventIbadahStore, import.meta.hot))
}
