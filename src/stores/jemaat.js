import { defineStore } from 'pinia'

export const useJemaatStore = defineStore('jemaat', {
  state: () => ({
    kartuJemaatDialog: false,
    cardMember: {
      fullName: 'Yonathan Mantiri',
      gender: 'L',
      birthPlace: 'Manado',
      birthDate: '1991-04-12',
      phone: '0812-3456-9901',
      email: 'yonathan.mantiri@mail.com',
      area: 'Wilayah Malalayang',
      family: 'Keluarga Mantiri',
      status: 'Aktif',
      membership: 'Anggota',
      baptismDate: '2009-05-12',
      address: 'Perumahan Malalayang Permai Blok C3',
      notes: 'Pelayan musik',
      emergencyContact: 'Rey Mantiri - 0813-1122-3434',
      photo: 'https://cdn.quasar.dev/img/avatar1.jpg',
      cardNumber: 'EC-2026-0001',
    },
    lastAction: null,
  }),
  actions: {
    setCardMember(member) {
      this.cardMember = member
    },
    setLastAction(action) {
      this.lastAction = action
    },
  },
})
