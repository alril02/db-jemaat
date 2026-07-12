import { defineStore, acceptHMRUpdate } from 'pinia'
import { createJemaat, getAllJemaat, getJemaatById, getJemaatByWilayah, searchJemaat, softDeleteJemaat, updateJemaat, getDashboardStats } from 'src/services/jemaatService'

const mapMemberForCard = (member) => ({
  fullName: member?.fullName || member?.name || '',
  gender: member?.gender || '',
  birthPlace: member?.birthPlace || '',
  birthDate: member?.birthDate || '',
  phone: member?.phone || '',
  email: member?.email || '',
  area: member?.area || '',
  family: member?.family || '',
  status: member?.status || 'Aktif',
  membership: member?.membership || 'Anggota',
  baptismDate: member?.baptismDate || '',
  address: member?.address || '',
  notes: member?.notes || '',
  emergencyContact: member?.emergencyContact || '',
  photo: member?.photo || 'https://cdn.quasar.dev/img/avatar1.jpg',
  cardNumber: member?.cardNumber || `EC-${String(member?.id || 0).padStart(4, '0')}`,
})

export const useJemaatStore = defineStore('jemaat', {
  state: () => ({
    kartuJemaatDialog: false,
    cardMember: mapMemberForCard(),
    listJemaat: [],
    selectedJemaat: null,
    loading: false,
    searchKeyword: '',
    selectedWilayah: '',
    lastAction: null,
    error: null,
  }),
  getters: {
    filteredJemaat: (state) => {
      const keyword = state.searchKeyword.trim().toLowerCase()
      return state.listJemaat.filter((member) => {
        const matchesKeyword = keyword
          ? [member.fullName, member.family, member.area, member.phone]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(keyword))
          : true
        const matchesWilayah = state.selectedWilayah ? member.area === state.selectedWilayah : true
        return matchesKeyword && matchesWilayah
      })
    },
    totalJemaat: (state) => state.listJemaat.length,
    wilayahOptions: (state) => {
      const values = new Set(state.listJemaat.map((member) => member.area).filter(Boolean))
      return Array.from(values).sort((a, b) => String(a).localeCompare(String(b)))
    },
  },
  actions: {
    setCardMember(member) {
      this.cardMember = mapMemberForCard(member)
      this.selectedJemaat = member || null
    },
    setLastAction(action) {
      this.lastAction = action
    },
    setSearchKeyword(keyword) {
      this.searchKeyword = keyword || ''
    },
    setSelectedWilayah(wilayah) {
      this.selectedWilayah = wilayah || ''
    },
    selectJemaat(member) {
      this.selectedJemaat = member || null
      if (member) {
        this.cardMember = mapMemberForCard(member)
      }
    },
    openKartuJemaatDialog(member) {
      if (member) {
        this.selectJemaat(member)
      }
      this.kartuJemaatDialog = true
    },
    closeKartuJemaatDialog() {
      this.kartuJemaatDialog = false
    },
    async loadJemaat() {
      this.loading = true
      this.error = null
      try {
        this.listJemaat = await getAllJemaat()
        return this.listJemaat
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async refreshJemaat() {
      return this.loadJemaat()
    },
    async searchMembers(keyword) {
      this.loading = true
      this.error = null
      try {
        this.listJemaat = keyword ? await searchJemaat(keyword) : await getAllJemaat()
        this.searchKeyword = keyword || ''
        return this.listJemaat
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async filterByWilayah(wilayah) {
      this.selectedWilayah = wilayah || ''
      if (!wilayah) {
        return this.loadJemaat()
      }

      this.loading = true
      this.error = null
      try {
        this.listJemaat = await getJemaatByWilayah(wilayah)
        return this.listJemaat
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async createJemaat(payload) {
      this.loading = true
      this.error = null
      try {
        const created = await createJemaat(payload)
        this.lastAction = 'create-jemaat'
        await this.loadJemaat()
        return created
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async updateJemaat(id, payload) {
      this.loading = true
      this.error = null
      try {
        const updated = await updateJemaat(id, payload)
        this.lastAction = 'update-jemaat'
        await this.loadJemaat()
        return updated
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async softDeleteJemaat(id) {
      this.loading = true
      this.error = null
      try {
        await softDeleteJemaat(id)
        this.lastAction = 'delete-jemaat'
        await this.loadJemaat()
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async getJemaatDetail(id) {
      return getJemaatById(id)
    },
    async loadDashboardStats() {
      this.loading = true
      this.error = null
      try {
        return await getDashboardStats()
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
  import.meta.hot.accept(acceptHMRUpdate(useJemaatStore, import.meta.hot))
}
