<template>
  <q-page class="page-dashboard">
    <div class="page-header">
      <div>
        <div class="text-h5 text-weight-bold">Dashboard Jemaat</div>
        <div class="text-caption text-grey-6">
          Ringkasan operasional gereja hari ini
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn color="primary" unelevated icon="person_add" label="Tambah Jemaat" @click="formDialog = true" />
        <q-btn outline color="primary" icon="cloud_upload" label="Impor Data" />
      </div>
    </div>

    <div class="row q-col-gutter-lg q-mt-md">
      <div class="col-12 col-md-6 col-lg-3" v-for="card in statCards" :key="card.title">
        <q-card class="stat-card" flat bordered>
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-grey-6">{{ card.title }}</div>
              <div class="text-h5 text-weight-bold q-mt-xs">{{ card.value }}</div>
              <div class="text-caption" :class="card.trendClass">
                <q-icon :name="card.trendIcon" size="16px" class="q-mr-xs" />
                {{ card.trend }}
              </div>
            </div>
            <q-avatar size="44px" :color="card.iconBg" text-color="white">
              <q-icon :name="card.icon" />
            </q-avatar>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-lg q-mt-lg">
      <div class="col-12 col-lg-8">
        <q-card flat bordered class="content-card">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Aktivitas Terbaru</div>
              <div class="text-caption text-grey-6">Perubahan data dalam 24 jam</div>
            </div>
            <q-btn flat color="primary" label="Lihat Semua" />
          </q-card-section>
          <q-separator />
          <q-list padding>
            <q-item v-for="activity in activities" :key="activity.title" clickable>
              <q-item-section avatar>
                <q-avatar :color="activity.color" text-color="white">
                  <q-icon :name="activity.icon" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ activity.title }}</q-item-label>
                <q-item-label caption>{{ activity.detail }}</q-item-label>
              </q-item-section>
              <q-item-section side class="text-caption text-grey-6">
                {{ activity.time }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <div class="col-12 col-lg-4">
        <QuickActionCard :actions="quickActions" @select="handleQuickAction" />

        <q-card flat bordered class="content-card q-mt-lg">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">Jadwal Pelayanan</div>
            <div class="text-caption text-grey-6">Minggu ini</div>
          </q-card-section>
          <q-separator />
          <q-list padding>
            <q-item v-for="schedule in schedules" :key="schedule.title">
              <q-item-section>
                <q-item-label>{{ schedule.title }}</q-item-label>
                <q-item-label caption>{{ schedule.detail }}</q-item-label>
              </q-item-section>
              <q-item-section side class="text-caption text-grey-6">
                {{ schedule.time }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>

    <q-card flat bordered class="content-card q-mt-lg">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">Jemaat Terbaru</div>
          <div class="text-caption text-grey-6">Registrasi bulan ini</div>
        </div>
        <q-btn flat color="primary" label="Kelola Jemaat" />
      </q-card-section>
      <q-separator />
      <q-card-section class="row q-col-gutter-md">
        <div class="col-12 col-md-6 col-lg-3" v-for="member in newestMembers" :key="member.name">
          <q-card flat bordered class="member-card">
            <q-card-section>
              <div class="row items-center no-wrap">
                <q-avatar size="40px" color="grey-3">
                  <q-icon name="person" color="primary" />
                </q-avatar>
                <div class="q-ml-sm">
                  <div class="text-subtitle2 text-weight-medium">{{ member.name }}</div>
                  <div class="text-caption text-grey-6">{{ member.area }}</div>
                </div>
              </div>
              <q-separator class="q-my-sm" />
              <div class="text-caption text-grey-6">Status</div>
              <div class="text-body2 text-weight-medium">{{ member.status }}</div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card>

    <FormTambahJemaat v-model="formDialog" />
    <KartuJemaatDialog />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import FormTambahJemaat from 'components/FormTambahJemaat.vue'
import QuickActionCard from 'components/QuickActionCard.vue'
import KartuJemaatDialog from 'components/KartuJemaatDialog.vue'
import { useJemaatStore } from 'stores/jemaat'

const formDialog = ref(false)
const jemaatStore = useJemaatStore()

const statCards = [
  {
    title: 'Total Jemaat',
    value: '2.438',
    trend: '+4.3% bulan ini',
    trendIcon: 'trending_up',
    trendClass: 'text-positive',
    icon: 'groups',
    iconBg: 'primary'
  },
  {
    title: 'Keluarga Terdata',
    value: '612',
    trend: '+1.8% minggu ini',
    trendIcon: 'trending_up',
    trendClass: 'text-positive',
    icon: 'home',
    iconBg: 'deep-purple'
  },
  {
    title: 'Kehadiran Ibadah',
    value: '1.876',
    trend: '-2.1% pekan lalu',
    trendIcon: 'trending_down',
    trendClass: 'text-negative',
    icon: 'event_available',
    iconBg: 'teal'
  },
  {
    title: 'Komsel Aktif',
    value: '48',
    trend: '+2 kelompok baru',
    trendIcon: 'add_circle',
    trendClass: 'text-positive',
    icon: 'diversity_3',
    iconBg: 'orange'
  }
]

const activities = [
  {
    title: 'Pendaftaran jemaat baru',
    detail: 'Maria Liow ditambahkan ke Wilayah Paal 2',
    time: '08:40',
    icon: 'person_add',
    color: 'primary'
  },
  {
    title: 'Perubahan status keluarga',
    detail: 'Keluarga Wowor pindah ke Wilayah Tikala',
    time: '09:12',
    icon: 'swap_horiz',
    color: 'indigo'
  },
  {
    title: 'Laporan pelayanan selesai',
    detail: 'Ibadah Rayon 3 telah diunggah',
    time: '10:05',
    icon: 'assignment_turned_in',
    color: 'positive'
  },
  {
    title: 'Pembaharuan data baptisan',
    detail: '5 jemaat dijadwalkan baptisan bulan depan',
    time: '11:20',
    icon: 'water_drop',
    color: 'cyan'
  }
]

const handleQuickAction = (action) => {
  if (action.action === 'print-card') {
    jemaatStore.kartuJemaatDialog = true
  }
}

const schedules = [
  {
    title: 'Ibadah Raya Pagi',
    detail: 'Pukul 08:00 - 10:00, Gedung Utama',
    time: 'Minggu'
  },
  {
    title: 'Komsel Wilayah Paal 2',
    detail: 'Host: Keluarga Mantiri',
    time: 'Selasa'
  },
  {
    title: 'Latihan Musik',
    detail: 'Pukul 18:00, Studio Musik',
    time: 'Jumat'
  }
]

const newestMembers = [
  {
    name: 'Yonathan Mantiri',
    area: 'Wilayah Malalayang',
    status: 'Aktif - Keluarga Mantiri'
  },
  {
    name: 'Ruth Tumiwa',
    area: 'Wilayah Paal 2',
    status: 'Aktif - Keluarga Tumiwa'
  },
  {
    name: 'Grace Poluan',
    area: 'Wilayah Tikala',
    status: 'Baptis baru - Keluarga Poluan'
  },
  {
    name: 'Rio Langi',
    area: 'Wilayah Tuminting',
    status: 'Aktif - Keluarga Langi'
  }
]
</script>
