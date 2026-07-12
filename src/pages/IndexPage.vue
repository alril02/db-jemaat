<template>
  <q-page class="page-dashboard q-pa-md">
    <!-- Page Header -->
    <div class="page-header row items-center justify-between q-col-gutter-sm">
      <div>
        <div class="text-h5 text-weight-bold text-grey-9">Dashboard Jemaat</div>
        <div class="text-caption text-grey-6">
          Ringkasan operasional gereja dan database lokal hari ini
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn
          v-if="!isViewer"
          color="primary"
          unelevated
          icon="person_add"
          label="Tambah Jemaat"
          style="border-radius: 8px;"
          @click="formDialog = true"
        />
        <q-btn
          outline
          color="primary"
          icon="settings"
          label="Pengaturan Sistem"
          style="border-radius: 8px;"
          to="/settings"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <!-- Statistics Cards -->
    <div v-else class="row q-col-gutter-md q-mt-md">
      <div class="col-12 col-sm-6 col-md-3" v-for="card in statCards" :key="card.title">
        <q-card class="stat-card shadow-1" flat bordered style="border-radius: 12px; height: 100%;">
          <q-card-section class="row items-center justify-between no-wrap">
            <div>
              <div class="text-caption text-grey-6 text-weight-medium">{{ card.title }}</div>
              <div class="text-h5 text-weight-bold text-grey-9 q-mt-xs">{{ card.value }}</div>
              <div class="text-caption text-weight-medium q-mt-xs" :class="card.trendClass">
                <q-icon :name="card.trendIcon" size="16px" class="q-mr-xs" />
                {{ card.trend }}
              </div>
            </div>
            <q-avatar size="44px" :color="card.iconBg" text-color="white" class="shadow-1">
              <q-icon :name="card.icon" />
            </q-avatar>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Quick Operations & Recent Activities -->
    <div class="row q-col-gutter-lg q-mt-md">
      <!-- Recent Activities -->
      <div class="col-12 col-lg-8">
        <q-card flat bordered class="content-card shadow-1" style="border-radius: 12px;">
          <q-card-section class="row items-center justify-between q-pa-md">
            <div>
              <div class="text-subtitle1 text-weight-bold text-grey-9">Aktivitas Terbaru</div>
              <div class="text-caption text-grey-6">Perubahan data yang tersimpan di SQLite lokal</div>
            </div>
            <q-btn flat color="primary" label="Kelola Data" to="/data-jemaat" style="border-radius: 8px;" />
          </q-card-section>
          <q-separator />
          <q-list padding separator>
            <q-item v-for="activity in activities" :key="activity.title" class="q-py-md">
              <q-item-section avatar>
                <q-avatar :color="activity.color" text-color="white" class="shadow-sm">
                  <q-icon :name="activity.icon" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold text-grey-8">{{ activity.title }}</q-item-label>
                <q-item-label caption class="text-grey-6">{{ activity.detail }}</q-item-label>
              </q-item-section>
              <q-item-section side class="text-caption text-grey-5">
                {{ activity.time }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Schedule and Quick Info -->
      <div class="col-12 col-lg-4">
        <q-card flat bordered class="content-card shadow-1" style="border-radius: 12px;">
          <q-card-section class="q-pa-md">
            <div class="text-subtitle1 text-weight-bold text-grey-9">Jadwal Pelayanan</div>
            <div class="text-caption text-grey-6">Agenda ibadah dan latihan pelayanan terdekat</div>
          </q-card-section>
          <q-separator />
          <q-list padding separator>
            <q-item v-for="schedule in schedules" :key="schedule.title" class="q-py-md">
              <q-item-section>
                <q-item-label class="text-weight-bold text-grey-8">{{ schedule.title }}</q-item-label>
                <q-item-label caption class="text-grey-6">{{ schedule.detail }}</q-item-label>
              </q-item-section>
              <q-item-section side class="text-caption text-weight-bold text-primary">
                {{ schedule.time }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>

    <!-- Newest Members Section -->
    <q-card flat bordered class="content-card q-mt-lg shadow-1" style="border-radius: 12px;">
      <q-card-section class="row items-center justify-between q-pa-md">
        <div>
          <div class="text-subtitle1 text-weight-bold text-grey-9">Jemaat Baru Terdaftar</div>
          <div class="text-caption text-grey-6">Registrasi jemaat terbaru dalam database lokal</div>
        </div>
        <q-btn flat color="primary" label="Lihat Lengkap" to="/data-jemaat" style="border-radius: 8px;" />
      </q-card-section>
      <q-separator />
      
      <q-card-section v-if="newestMembers.length === 0" class="text-center q-py-lg text-grey-6">
        Belum ada jemaat terdaftar.
      </q-card-section>
      
      <q-card-section v-else class="row q-col-gutter-md q-pa-md">
        <div class="col-12 col-sm-6 col-md-3" v-for="member in newestMembers" :key="member.name">
          <q-card flat bordered class="member-card shadow-sm" style="border-radius: 8px; border-left: 3px solid var(--q-primary);">
            <q-card-section class="q-pa-sm">
              <div class="row items-center no-wrap">
                <q-avatar size="36px" class="shadow-sm">
                  <img :src="member.photo" alt="avatar" />
                </q-avatar>
                <div class="q-ml-sm">
                  <div class="text-subtitle2 text-weight-bold text-grey-9">{{ member.name }}</div>
                  <div class="text-caption text-grey-6">{{ member.area }}</div>
                </div>
              </div>
              <q-separator class="q-my-sm" />
              <div class="row items-center justify-between">
                <span class="text-caption text-grey-6">Status</span>
                <span class="text-caption text-weight-bold text-primary">{{ member.status }}</span>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card>

    <FormTambahJemaat v-model="formDialog" @saved="handleSaved" />
    <KartuJemaatDialog />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FormTambahJemaat from 'components/FormTambahJemaat.vue'
import KartuJemaatDialog from 'components/KartuJemaatDialog.vue'
import { useJemaatStore } from 'stores/jemaat'
import { useSessionStore } from 'stores/session'

const formDialog = ref(false)
const jemaatStore = useJemaatStore()
const sessionStore = useSessionStore()

const loading = ref(true)
const stats = ref({
  total: 0,
  active: 0,
  nonActive: 0,
  keluarga: 0,
  wilayah: 0,
  newThisMonth: 0,
  incomplete: 0
})

const isViewer = computed(() => sessionStore.currentUser?.roleCode === 'viewer')

const statCards = computed(() => [
  {
    title: 'Total Jemaat',
    value: String(stats.value.total),
    trend: `Aktif: ${stats.value.active} | Nonaktif: ${stats.value.nonActive}`,
    trendIcon: 'people',
    trendClass: 'text-positive',
    icon: 'groups',
    iconBg: 'primary'
  },
  {
    title: 'Keluarga Terdata',
    value: String(stats.value.keluarga),
    trend: `Tersebar di ${stats.value.wilayah} wilayah`,
    trendIcon: 'home',
    trendClass: 'text-positive',
    icon: 'home',
    iconBg: 'deep-purple'
  },
  {
    title: 'Pendaftaran Baru',
    value: String(stats.value.newThisMonth),
    trend: 'Bulan ini (real-time)',
    trendIcon: 'person_add',
    trendClass: 'text-positive',
    icon: 'person_add',
    iconBg: 'teal'
  },
  {
    title: 'Data Belum Lengkap',
    value: String(stats.value.incomplete),
    trend: 'Perlu verifikasi ulang',
    trendIcon: 'priority_high',
    trendClass: 'text-warning',
    icon: 'priority_high',
    iconBg: 'orange'
  }
])

const newestMembers = computed(() => {
  return jemaatStore.listJemaat.slice(0, 4).map(m => ({
    name: m.fullName || m.name || '',
    area: m.area || '',
    status: m.status || '',
    photo: m.photo || 'https://cdn.quasar.dev/img/avatar1.jpg'
  }))
})

const activities = [
  {
    title: 'Pendaftaran jemaat baru',
    detail: 'Data jemaat tersimpan di SQLite lokal',
    time: 'Terbaru',
    icon: 'person_add',
    color: 'primary'
  },
  {
    title: 'Perubahan status keluarga',
    detail: 'Keluarga terhubung ke wilayah rayon',
    time: 'Terbaru',
    icon: 'swap_horiz',
    color: 'indigo'
  },
  {
    title: 'Database Terkunci PIN',
    detail: 'Proteksi keamanan data lokal diaktifkan',
    time: 'Sistem',
    icon: 'security',
    color: 'positive'
  }
]

const schedules = [
  {
    title: 'Ibadah Raya Pagi',
    detail: 'Pukul 08:00 - 10:00, Gedung Utama',
    time: 'Minggu'
  },
  {
    title: 'Komsel Wilayah Malalayang',
    detail: 'Host: Keluarga Mantiri',
    time: 'Selasa'
  },
  {
    title: 'Latihan Musik & Pelayanan',
    detail: 'Pukul 18:00, Studio Musik',
    time: 'Jumat'
  }
]

const fetchStats = async () => {
  loading.value = true
  try {
    stats.value = await jemaatStore.loadDashboardStats()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSaved = async () => {
  await jemaatStore.loadJemaat()
  await fetchStats()
}

onMounted(async () => {
  if (!sessionStore.loaded) {
    await sessionStore.bootstrapCurrentUser()
  }

  await jemaatStore.loadJemaat()
  await fetchStats()
})
</script>

<style lang="scss" scoped>
.page-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 16px;
}
.stat-card {
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  }
}
</style>
