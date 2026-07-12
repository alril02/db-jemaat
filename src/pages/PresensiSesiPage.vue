<template>
  <q-page class="q-pa-md bg-grey-1 flex column">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-center q-pa-xl col-grow">
      <q-spinner color="primary" size="40px" />
    </div>

    <!-- Active Presensi Interface -->
    <template v-else-if="event">
      <!-- Top Sticky Info Header -->
      <q-card flat bordered class="shadow-1 q-mb-md" style="border-radius: 12px;">
        <q-card-section class="q-pa-md">
          <div class="row items-center justify-between no-wrap">
            <div class="row items-center no-wrap">
              <q-btn flat round icon="arrow_back" color="grey-8" to="/events" class="q-mr-xs" />
              <div>
                <div class="text-subtitle1 text-weight-bold text-grey-9 row items-center no-wrap">
                  {{ event.namaEvent }}
                  <q-chip
                    v-if="event.status === 'active'"
                    color="positive"
                    text-color="white"
                    size="xs"
                    class="q-ml-sm text-weight-bold animate-pulse"
                  >
                    SESI AKTIF
                  </q-chip>
                  <q-chip
                    v-else
                    color="grey-4"
                    text-color="grey-9"
                    size="xs"
                    class="q-ml-sm text-weight-bold"
                  >
                    TERKUNCI (SELESAI)
                  </q-chip>
                </div>
                <div class="text-caption text-grey-6">
                  {{ event.jenisEvent }} | {{ event.tanggal }}
                </div>
              </div>
            </div>

            <!-- Lock / Unlock indicator or End Session button -->
            <q-btn
              v-if="event.status === 'active' && !isViewer"
              color="dark"
              unelevated
              icon="stop"
              label="Selesaikan"
              style="border-radius: 8px;"
              @click="confirmFinish"
            />
          </div>

          <!-- Progress stats -->
          <div class="row items-center q-mt-md q-col-gutter-sm">
            <div class="col-12 col-sm-3 text-caption text-grey-7 text-weight-medium">
              Progres Kehadiran: <strong>{{ totalHadir }} / {{ totalJemaatActive }}</strong> Jemaat
            </div>
            <div class="col-12 col-sm-7">
              <q-linear-progress
                :value="attendancePercentage / 100"
                color="primary"
                track-color="grey-3"
                size="10px"
                style="border-radius: 5px;"
              />
            </div>
            <div class="col-12 col-sm-2 text-right text-subtitle2 text-weight-bold text-primary">
              {{ attendancePercentage }}% Hadir
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Lock Banner if Finished -->
      <q-banner
        v-if="event.status !== 'active'"
        dense
        inline-actions
        class="bg-orange-1 text-orange-9 rounded-borders q-mb-md q-pa-sm"
      >
        <template #avatar>
          <q-icon name="lock" />
        </template>
        Sesi ibadah ini telah diselesaikan dan dikunci. Data kehadiran bersifat hanya baca (tidak dapat diubah).
      </q-banner>

      <!-- Filter Controls & Search -->
      <q-card flat bordered class="shadow-1 q-mb-md" style="border-radius: 12px;">
        <q-card-section class="q-pa-sm">
          <div class="row q-col-gutter-sm items-center">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="search"
                dense
                outlined
                placeholder="Cari nama jemaat..."
                clearable
                style="border-radius: 8px;"
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="selectedWilayah"
                :options="wilayahOptions"
                dense
                outlined
                label="Filter Wilayah"
                emit-value
                map-options
                clearable
                style="border-radius: 8px;"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Tabbed Attendance List (Active Check-in) -->
      <q-card flat bordered class="shadow-1 col-grow flex column" style="border-radius: 12px;">
        <q-tabs
          v-model="activeTab"
          class="text-grey-7"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          style="border-bottom: 1px solid rgba(0,0,0,0.05);"
        >
          <q-tab name="belum" :label="`Belum Hadir (${filteredBelumHadir.length})`" />
          <q-tab name="sudah" :label="`Sudah Hadir (${filteredSudahHadir.length})`" />
        </q-tabs>

        <q-tab-panels v-model="activeTab" animated class="col-grow bg-white">
          <!-- Belum Hadir Tab -->
          <q-tab-panel name="belum" class="q-pa-none">
            <div v-if="filteredBelumHadir.length === 0" class="text-center q-pa-xl text-grey-6 flex flex-center column">
              <q-icon name="check_circle_outline" size="56px" color="positive" />
              <div class="text-subtitle2 text-weight-bold text-grey-9 q-mt-md">Semua Jemaat Telah Hadir</div>
              <div class="text-caption text-grey-6">Atau coba ubah kata kunci pencarian/wilayah Anda.</div>
            </div>

            <q-list v-else separator class="q-px-sm">
              <q-item v-for="j in filteredBelumHadir" :key="j.id" class="q-py-md">
                <q-item-section>
                  <q-item-label class="text-subtitle2 text-weight-bold text-grey-9">
                    {{ j.fullName || j.name }}
                  </q-item-label>
                  <q-item-label caption class="text-grey-6">
                    Wilayah: {{ j.area || 'Tanpa Wilayah' }} | Keluarga: {{ j.family || '-' }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-btn
                    :disable="event.status !== 'active' || isViewer"
                    color="positive"
                    unelevated
                    size="sm"
                    icon="check"
                    label="Tandai Hadir"
                    style="border-radius: 6px;"
                    @click="markJemaatHadir(j)"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- Sudah Hadir Tab -->
          <q-tab-panel name="sudah" class="q-pa-none">
            <div v-if="filteredSudahHadir.length === 0" class="text-center q-pa-xl text-grey-6 flex flex-center column">
              <q-icon name="assignment" size="56px" color="grey-4" />
              <div class="text-subtitle2 text-weight-bold text-grey-9 q-mt-md">Belum Ada Kehadiran</div>
              <div class="text-caption text-grey-6">Ketuk tombol "Tandai Hadir" pada jemaat yang datang.</div>
            </div>

            <q-list v-else separator class="q-px-sm">
              <q-item v-for="p in filteredSudahHadir" :key="p.id" class="q-py-md">
                <q-item-section>
                  <q-item-label class="text-subtitle2 text-weight-bold text-grey-9">
                    {{ p.jemaatName }}
                  </q-item-label>
                  <q-item-label caption class="text-grey-6">
                    Wilayah: {{ p.wilayahName }} | Waktu Check-in: {{ formatTime(p.waktuPresensi) }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-btn
                    v-if="event.status === 'active' && !isViewer"
                    flat
                    round
                    color="negative"
                    icon="close"
                    size="sm"
                    @click="cancelJemaatPresensi(p)"
                  >
                    <q-tooltip>Batalkan Kehadiran</q-tooltip>
                  </q-btn>
                  <q-chip v-else outline color="primary" size="xs" class="text-weight-bold text-uppercase">
                    {{ p.metodePresensi || 'Search' }}
                  </q-chip>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </template>

    <!-- Error State -->
    <div v-else class="flex flex-center q-pa-xl col-grow column text-grey-6">
      <q-icon name="error_outline" size="56px" />
      <div class="text-subtitle1 text-weight-bold q-mt-md">Event Tidak Ditemukan</div>
      <q-btn flat color="primary" label="Kembali" to="/events" class="q-mt-sm" />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from 'stores/event'
import { usePresensiStore } from 'stores/presensi'
import { useJemaatStore } from 'stores/jemaat'
import { useWilayahStore } from 'stores/wilayah'
import { useSessionStore } from 'stores/session'
import { useQuasar } from 'quasar'

const route = useRoute()
const router = useRouter()
const eventStore = useEventStore()
const presensiStore = usePresensiStore()
const jemaatStore = useJemaatStore()
const wilayahStore = useWilayahStore()
const sessionStore = useSessionStore()
const $q = useQuasar()

const eventId = Number(route.params.id)

const loading = ref(true)
const search = ref('')
const selectedWilayah = ref(null)
const activeTab = ref('belum')

const event = computed(() => eventStore.currentEvent)
const listPresensi = computed(() => presensiStore.listPresensi)
const totalHadir = computed(() => presensiStore.totalHadir)
const isViewer = computed(() => sessionStore.currentUser?.roleCode === 'viewer')

const totalJemaatActive = computed(() => {
  return jemaatStore.listJemaat.filter(j => j.status === 'Aktif').length
})

const attendancePercentage = computed(() => {
  if (totalJemaatActive.value === 0) return 0
  return Math.round((totalHadir.value / totalJemaatActive.value) * 100)
})

const wilayahOptions = computed(() => {
  return wilayahStore.listWilayah.map(w => ({
    label: w.nama,
    value: w.id
  }))
})

// Present members
const filteredSudahHadir = computed(() => {
  const keyword = search.value.toLowerCase().trim()
  return listPresensi.value.filter(p => {
    const matchesKeyword = !keyword || p.jemaatName.toLowerCase().includes(keyword)
    const matchesWilayah = !selectedWilayah.value || p.wilayahId === selectedWilayah.value
    return matchesKeyword && matchesWilayah
  })
})

// Absent members
const filteredBelumHadir = computed(() => {
  const keyword = search.value.toLowerCase().trim()
  const presentIds = new Set(listPresensi.value.map(p => p.jemaatId))

  return jemaatStore.listJemaat.filter(j => {
    // Only active members
    if (j.status !== 'Aktif') return false
    // Not present yet
    if (presentIds.has(j.id)) return false

    const matchesKeyword = !keyword || (j.fullName || j.name || '').toLowerCase().includes(keyword)
    const matchesWilayah = !selectedWilayah.value || j.wilayahId === selectedWilayah.value

    return matchesKeyword && matchesWilayah
  })
})

const markJemaatHadir = async (jemaat) => {
  try {
    const userId = sessionStore.currentUser?.id || 1
    const result = await presensiStore.checkIn(eventId, jemaat.id, userId, 'quick_list')
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: `${jemaat.fullName || jemaat.name} berhasil ditandai hadir.`,
        timeout: 1000,
        position: 'bottom'
      })
    } else {
      $q.notify({ type: 'warning', message: result.message })
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Gagal merekam presensi.' })
  }
}

const cancelJemaatPresensi = async (presensi) => {
  $q.dialog({
    title: 'Batalkan Kehadiran',
    message: `Apakah Anda yakin ingin membatalkan kehadiran untuk "${presensi.jemaatName}"?`,
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Batalkan', color: 'negative', unelevated: true },
    persistent: true
  }).onOk(async () => {
    try {
      await presensiStore.checkOut(eventId, presensi.jemaatId)
      $q.notify({
        type: 'positive',
        message: 'Kehadiran berhasil dibatalkan.',
        timeout: 1000
      })
    } catch (error) {
      $q.notify({ type: 'negative', message: error.message || 'Gagal membatalkan presensi.' })
    }
  })
}

const confirmFinish = () => {
  $q.dialog({
    title: 'Selesaikan Ibadah & Kunci Presensi',
    message: 'Apakah Anda yakin ingin menyelesaikan sesi ini? Kehadiran jemaat akan dikunci secara permanen.',
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Selesaikan & Kunci', color: 'dark', unelevated: true },
    persistent: true
  }).onOk(async () => {
    try {
      await eventStore.finishSesi(eventId)
      $q.notify({ type: 'positive', message: 'Sesi ibadah selesai dan presensi dikunci.' })
      router.push('/events')
    } catch (error) {
      $q.notify({ type: 'negative', message: error.message || 'Gagal menyelesaikan sesi.' })
    }
  })
}

const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  try {
    const d = new Date(timeStr)
    return d.toTimeString().slice(0, 5)
  } catch {
    return timeStr
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      eventStore.getEventDetail(eventId),
      presensiStore.loadPresensi(eventId),
      jemaatStore.loadJemaat(),
      wilayahStore.loadWilayah()
    ])
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.col-grow {
  flex-grow: 1;
}
.animate-pulse {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}
</style>
