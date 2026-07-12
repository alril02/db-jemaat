import { defineStore, acceptHMRUpdate } from 'pinia'
import { loadCurrentUser, verifyPin, updateCredentials } from 'src/services/sessionService'

export const useSessionStore = defineStore('session', {
  state: () => ({
    currentUser: null,
    loading: false,
    loaded: false,
    error: null,
    locked: true,
  }),
  getters: {
    isAuthenticated: (state) => !!state.currentUser,
    mustChangeCredential: (state) => state.currentUser?.mustChangeCredential ?? false,
    isLocked: (state) => state.locked && !!state.currentUser && !state.currentUser.mustChangeCredential,
  },
  actions: {
    async bootstrapCurrentUser() {
      this.loading = true
      this.error = null
      try {
        this.currentUser = await loadCurrentUser()
        this.loaded = true
        // If credentials are set, default to locked; if CHANGE_ME, don't lock so they can set it up
        if (this.currentUser) {
          this.locked = !this.currentUser.mustChangeCredential
        }
        return this.currentUser
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async unlock(pin) {
      if (!this.currentUser) return false
      this.loading = true
      try {
        const isValid = await verifyPin(this.currentUser.id, pin)
        if (isValid) {
          this.locked = false
        }
        return isValid
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        return false
      } finally {
        this.loading = false
      }
    },
    async changeCredentials(newPassword, newPin) {
      if (!this.currentUser) return false
      this.loading = true
      this.error = null
      try {
        await updateCredentials(this.currentUser.id, newPassword, newPin)
        // Refresh session
        await this.bootstrapCurrentUser()
        this.locked = false
        return true
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    lock() {
      if (this.currentUser && !this.currentUser.mustChangeCredential) {
        this.locked = true
      }
    },
    clearSession() {
      this.currentUser = null
      this.loaded = true
      this.locked = true
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSessionStore, import.meta.hot))
}
