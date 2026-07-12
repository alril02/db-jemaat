import { defineStore, acceptHMRUpdate } from 'pinia'
import {
  createEventIbadah,
  getAllEventIbadah,
  getTodayEvents,
  getEventById,
  updateEventIbadah,
  deleteEventIbadah,
  startEvent,
  finishEvent,
  cancelEvent
} from 'src/services/eventIbadahService'

export const useEventStore = defineStore('event', {
  state: () => ({
    listEvents: [],
    todayEvents: [],
    currentEvent: null,
    loading: false,
    error: null
  }),
  actions: {
    async loadEvents() {
      this.loading = true
      this.error = null
      try {
        this.listEvents = await getAllEventIbadah()
        return this.listEvents
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async loadTodayEvents() {
      this.loading = true
      this.error = null
      try {
        this.todayEvents = await getTodayEvents()
        return this.todayEvents
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async getEventDetail(id) {
      this.loading = true
      this.error = null
      try {
        this.currentEvent = await getEventById(id)
        return this.currentEvent
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
        const created = await createEventIbadah(payload)
        await this.loadEvents()
        return created
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async updateEvent(id, payload) {
      this.loading = true
      this.error = null
      try {
        const updated = await updateEventIbadah(id, payload)
        await this.loadEvents()
        return updated
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async deleteEvent(id) {
      this.loading = true
      this.error = null
      try {
        await deleteEventIbadah(id)
        await this.loadEvents()
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async startSesi(id) {
      this.loading = true
      this.error = null
      try {
        const updated = await startEvent(id)
        await this.loadEvents()
        if (this.currentEvent && this.currentEvent.id === id) {
          this.currentEvent = updated
        }
        return updated
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async finishSesi(id) {
      this.loading = true
      this.error = null
      try {
        const updated = await finishEvent(id)
        await this.loadEvents()
        if (this.currentEvent && this.currentEvent.id === id) {
          this.currentEvent = updated
        }
        return updated
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async cancelSesi(id) {
      this.loading = true
      this.error = null
      try {
        const updated = await cancelEvent(id)
        await this.loadEvents()
        if (this.currentEvent && this.currentEvent.id === id) {
          this.currentEvent = updated
        }
        return updated
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEventStore, import.meta.hot))
}
