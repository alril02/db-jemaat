<template>
  <q-card flat bordered class="content-card">
    <q-card-section>
      <div class="text-subtitle1 text-weight-bold">Quick Actions</div>
      <div class="text-caption text-grey-6">Akses cepat untuk tablet</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <div class="row q-gutter-sm">
        <q-btn v-for="menu in menus" :key="menu.label" :color="menu.color" :icon="menu.icon" :label="menu.label"
          unelevated glossy align="left" class="q-px-md" @click="menu.action && menu.action()" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { useJemaatStore } from 'src/stores/jemaat';
const jemaatStore = useJemaatStore();
const menus = [
  { label: 'Tambah Keluarga', icon: 'group_add', color: 'primary', action: null },
  { label: 'Cetak Kartu Jemaat', icon: 'print', color: 'secondary', action: () => { jemaatStore.kartuJemaatDialog = true } },
  { label: 'Laporan Ibadah', icon: 'description', color: 'accent', action: null },
  { label: 'Kelola Jadwal Pelayanan', icon: 'event', color: 'positive', action: null }
]
</script>
