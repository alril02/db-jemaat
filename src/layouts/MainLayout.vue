<template>
  <q-layout view="hHh Lpr lFf" class="app-shell">
    <q-header elevated class="app-header">
      <q-toolbar class="app-toolbar">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-avatar size="32px" class="q-ml-sm app-logo">
          <q-icon name="account_balance" />
        </q-avatar>

        <q-toolbar-title class="text-weight-bold q-ml-sm">
          DB Jemaat
        </q-toolbar-title>

        <q-space />

        <q-input
          v-model="search"
          dense
          outlined
          rounded
          placeholder="Cari jemaat, keluarga, atau wilayah"
          class="app-search"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-btn flat round icon="help_outline" aria-label="Bantuan" class="q-ml-sm" />
        <q-btn flat round icon="notifications" aria-label="Notifikasi" />

        <q-avatar size="36px" class="q-ml-md">
          <img src="https://cdn.quasar.dev/img/avatar.png" alt="Admin" />
        </q-avatar>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="app-drawer"
      :width="280"
    >
      <q-scroll-area class="fit">
        <q-list padding class="q-gutter-y-sm">
          <q-item-label header class="text-grey-7">
            Navigasi Utama
          </q-item-label>

          <q-item
            v-for="item in navItems"
            :key="item.label"
            clickable
            v-ripple
            :to="item.to"
            :exact="item.exact"
            :disable="item.disabled"
            exact-active-class="app-nav-active"
            :class="{ 'app-nav-disabled': item.disabled }"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ item.label }}</q-item-label>
              <q-item-label caption>{{ item.caption }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <div class="q-pa-md">
          <q-card flat bordered class="app-side-card">
            <q-card-section>
              <div class="text-subtitle2 text-weight-medium">Ringkasan Cepat</div>
              <div class="text-caption text-grey-6">Update terakhir 2 menit lalu</div>
            </q-card-section>
            <q-separator />
            <q-card-section class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-6">Kehadiran Minggu Ini</div>
                <div class="text-h6 text-weight-bold">86%</div>
              </div>
              <q-icon name="insights" size="28px" color="primary" />
            </q-card-section>
          </q-card>
        </div>

        <div class="q-pa-md">
          <q-card flat bordered class="app-profile">
            <q-card-section class="row items-center">
              <q-avatar size="44px">
                <img src="https://cdn.quasar.dev/img/avatar.png" alt="Admin" />
              </q-avatar>
              <div class="q-ml-md">
                <div class="text-subtitle2 text-weight-medium">Admin Gereja</div>
                <div class="text-caption text-grey-6">Sekretariat</div>
              </div>
            </q-card-section>
            <q-card-actions align="between">
              <q-btn flat color="primary" label="Profil" />
              <q-btn flat color="negative" label="Keluar" />
            </q-card-actions>
          </q-card>
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'

const leftDrawerOpen = ref(false)
const search = ref('')

const navItems = [
  {
    label: 'Dashboard',
    caption: 'Ringkasan dan statistik',
    icon: 'dashboard',
    to: '/',
    exact: true
  },
  {
    label: 'Data Jemaat',
    caption: 'Profil dan keluarga',
    icon: 'groups',
    to: '/data-jemaat'
  },
  {
    label: 'Data Keluarga',
    caption: 'Manajemen keluarga jemaat',
    icon: 'home',
    to: '/keluarga'
  },
  {
    label: 'Wilayah',
    caption: 'Manajemen rayon wilayah',
    icon: 'map',
    to: '/wilayah'
  },
  {
    label: 'Sesi Ibadah',
    caption: 'Event & Presensi Jemaat',
    icon: 'event',
    to: '/events',
    disabled: false
  },
  {
    label: 'Keuangan',
    caption: 'Persembahan & kas',
    icon: 'account_balance_wallet',
    to: '/',
    disabled: true
  },
  {
    label: 'Pengaturan',
    caption: 'Akun dan sistem',
    icon: 'settings',
    to: '/settings'
  }
]

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
