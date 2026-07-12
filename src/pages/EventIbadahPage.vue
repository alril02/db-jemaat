<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-col-gutter-sm page-header">
      <div>
        <div class="text-h5 text-weight-bold text-grey-9">Sesi Ibadah & Kegiatan</div>
        <div class="text-caption text-grey-6">Buat jadwal, mulai sesi ibadah, dan pantau kehadiran jemaat</div>
      </div>
      <q-btn
        v-if="!isViewer"
        color="primary"
        unelevated
        icon="add"
        label="Buat Event Baru"
        style="border-radius: 8px;"
        @click="openAddDialog"
      />
    </div>

    <!-- Main Content Layout -->
    <div class="row q-col-gutter-lg q-mt-md">
      <!-- Left side: Event List -->
      <div class="col-12 col-lg-7">
        <q-card flat bordered class="shadow-1" style="border-radius: 12px;">
          <q-card-section class="q-pa-md row items-center justify-between">
            <div class="text-subtitle1 text-weight-bold text-grey-9">Daftar Kegiatan</div>
            <q-input
              v-model="search"
              dense
              outlined
              placeholder="Cari event..."
              style="max-width: 250px; border-radius: 8px;"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </q-card-section>
          
          <q-separator />

          <div v-if="eventStore.loading" class="flex flex-center q-pa-xl">
            <q-spinner color="primary" size="40px" />
          </div>

          <div v-else-if="filteredEvents.length === 0" class="text-center q-pa-xl flex flex-center column">
            <q-icon name="event_busy" size="56px" color="grey-5" />
            <div class="text-subtitle1 text-weight-medium text-grey-8 q-mt-md">Tidak Ada Kegiatan</div>
            <div class="text-caption text-grey-6 q-mt-xs">Belum ada kegiatan terdaftar atau ubah pencarian Anda.</div>
          </div>

          <q-list v-else separator>
            <q-item
              v-for="evt in filteredEvents"
              :key="evt.id"
              clickable
              @click="selectEvent(evt)"
              :active="selectedEvent?.id === evt.id"
              active-class="bg-blue-0"
              class="q-py-md"
            >
              <q-item-section avatar>
                <q-avatar :color="getStatusColor(evt.status)" text-color="white" class="shadow-1">
                  <q-icon :name="getEventIcon(evt.jenisEvent)" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-bold text-grey-9 text-subtitle2">
                  {{ evt.namaEvent }}
                </q-item-label>
                <q-item-label caption class="text-grey-7 row items-center q-gutter-x-sm q-mt-xs">
                  <span><q-icon name="calendar_today" /> {{ evt.tanggal }}</span>
                  <span><q-icon name="schedule" /> {{ evt.jamMulai }} - {{ evt.jamSelesai || 'Selesai' }}</span>
                  <span v-if="evt.lokasi"><q-icon name="place" /> {{ evt.lokasi }}</span>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="column items-end q-gutter-y-xs">
                  <q-chip
                    :color="getStatusChipColor(evt.status)"
                    :text-color="evt.status === 'active' ? 'white' : 'grey-9'"
                    size="sm"
                    class="text-weight-bold"
                    :class="{ 'animate-pulse': evt.status === 'active' }"
                  >
                    {{ getStatusLabel(evt.status) }}
                  </q-chip>
                  
                  <!-- Actions for Draft/Active Events -->
                  <div class="row q-gutter-xs" v-if="!isViewer">
                    <!-- Buka Presensi (if active) -->
                    <q-btn
                      v-if="evt.status === 'active'"
                      size="sm"
                      unelevated
                      color="positive"
                      icon="assignment_turned_in"
                      label="Presensi"
                      :to="`/events/${evt.id}/presensi`"
                    />
                    <!-- Mulai Ibadah (if draft) -->
                    <q-btn
                      v-if="evt.status === 'draft'"
                      size="sm"
                      unelevated
                      color="primary"
                      icon="play_arrow"
                      label="Mulai Sesi"
                      @click.stop="confirmStart(evt)"
                    />
                    <!-- Selesai (if active) -->
                    <q-btn
                      v-if="evt.status === 'active'"
                      size="sm"
                      outline
                      color="dark"
                      icon="stop"
                      label="Selesai"
                      @click.stop="confirmFinish(evt)"
                    />
                  </div>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Right side: Detail Reports -->
      <div class="col-12 col-lg-5">
        <q-card v-if="selectedEvent" flat bordered class="shadow-1" style="border-radius: 12px;">
          <!-- Detail Title -->
          <q-card-section class="bg-grey-1 row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold text-grey-9">{{ selectedEvent.namaEvent }}</div>
              <div class="text-caption text-grey-6">{{ getStatusLabel(selectedEvent.status) }} | {{ selectedEvent.jenisEvent }}</div>
            </div>
            <div class="row q-gutter-sm" v-if="!isViewer">
              <q-btn flat round color="secondary" icon="edit" size="sm" @click="openEditDialog(selectedEvent)" />
              <q-btn
                v-if="selectedEvent.status === 'draft'"
                flat
                round
                color="negative"
                icon="delete"
                size="sm"
                @click="confirmDelete(selectedEvent)"
              />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-md text-grey-8">
            <div class="row q-col-gutter-sm text-caption">
              <div class="col-4 text-grey-6">Tanggal:</div>
              <div class="col-8 text-weight-medium">{{ selectedEvent.tanggal }}</div>
              
              <div class="col-4 text-grey-6">Waktu Sesi:</div>
              <div class="col-8 text-weight-medium">{{ selectedEvent.jamMulai }} s/d {{ selectedEvent.jamSelesai || 'Selesai' }}</div>

              <div class="col-4 text-grey-6">Lokasi:</div>
              <div class="col-8 text-weight-medium">{{ selectedEvent.lokasi || '-' }}</div>

              <div class="col-4 text-grey-6" v-if="selectedEvent.catatan">Catatan:</div>
              <div class="col-8 text-weight-medium" v-if="selectedEvent.catatan">{{ selectedEvent.catatan }}</div>
            </div>
          </q-card-section>

          <q-separator />

          <!-- Loading state for statistics -->
          <div v-if="loadingStats" class="flex flex-center q-pa-lg">
            <q-spinner color="primary" size="28px" />
          </div>

          <!-- Stats content -->
          <template v-else>
            <!-- Big Stats Card Section -->
            <q-card-section class="q-pa-md">
              <div class="row q-col-gutter-md">
                <!-- Hadir -->
                <div class="col-6">
                  <q-card flat bordered class="bg-blue-0 text-center q-pa-sm" style="border-radius: 8px;">
                    <div class="text-caption text-grey-7 text-weight-medium">Total Hadir</div>
                    <div class="text-h4 text-weight-bold text-primary q-mt-xs">{{ totalHadir }}</div>
                  </q-card>
                </div>
                <!-- Kehadiran % -->
                <div class="col-6">
                  <q-card flat bordered class="bg-teal-0 text-center q-pa-sm" style="border-radius: 8px;">
                    <div class="text-caption text-grey-7 text-weight-medium">Persentase</div>
                    <div class="text-h4 text-weight-bold text-teal q-mt-xs">{{ attendancePercentage }}%</div>
                  </q-card>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <!-- Tabs: Wilayah Recap & Attendance List -->
            <q-tabs v-model="tab" dense class="text-grey-7" active-color="primary" indicator-color="primary" align="justify">
              <q-tab name="wilayah" label="Per Wilayah" />
              <q-tab name="jemaat" label="Daftar Hadir" />
            </q-tabs>

            <q-tab-panels v-model="tab" animated>
              <!-- Wilayah Recap Panel -->
              <q-tab-panel name="wilayah" class="q-pa-none">
                <q-list separator dense>
                  <q-item v-for="w in rekapWilayah" :key="w.wilayahId" class="q-py-md">
                    <q-item-section>
                      <q-item-label class="text-weight-medium text-grey-9">{{ w.wilayah }}</q-item-label>
                      <q-item-label caption class="text-grey-6">Rayon Wilayah Jemaat</q-item-label>
                    </q-item-section>
                    <q-item-section side class="text-right">
                      <div class="text-weight-bold text-primary">{{ w.totalHadir }} Hadir</div>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="rekapWilayah.length === 0" class="text-center text-grey-6 q-pa-md">
                    Belum ada data kehadiran terekam.
                  </q-item>
                </q-list>
              </q-tab-panel>

              <!-- Attendance List Panel -->
              <q-tab-panel name="jemaat" class="q-pa-none">
                <q-list separator dense style="max-height: 250px; overflow-y: auto;">
                  <q-item v-for="p in listPresensi" :key="p.id">
                    <q-item-section>
                      <q-item-label class="text-weight-medium text-grey-9">{{ p.jemaatName }}</q-item-label>
                      <q-item-label caption class="text-grey-6">
                        Wilayah: {{ p.wilayahName }} | Waktu: {{ formatTime(p.waktuPresensi) }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-chip outline color="primary" size="xs" class="text-weight-bold text-uppercase">
                        {{ p.metodePresensi || 'Search' }}
                      </q-chip>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="listPresensi.length === 0" class="text-center text-grey-6 q-pa-md">
                    Belum ada jemaat yang check-in.
                  </q-item>
                </q-list>
              </q-tab-panel>
            </q-tab-panels>
          </template>
        </q-card>

        <!-- No Event Selected State -->
        <q-card v-else flat bordered class="shadow-1 flex flex-center column q-pa-xl" style="border-radius: 12px; height: 100%; min-height: 350px;">
          <q-icon name="insert_chart_outlined" size="56px" color="grey-4" />
          <div class="text-subtitle1 text-weight-bold text-grey-7 q-mt-md">Pilih Kegiatan</div>
          <div class="text-caption text-grey-5 q-mt-xs">Klik salah satu kegiatan untuk melihat detail laporan kehadiran</div>
        </q-card>
      </div>
    </div>

    <!-- Dialog Form Tambah/Edit Event -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 320px; width: 100%; max-width: 500px; border-radius: 12px;">
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1 text-weight-bold">
            {{ editingEvent ? 'Ubah Informasi Event' : 'Buat Event Ibadah / Sesi Baru' }}
          </div>
          <q-btn flat round icon="close" @click="dialogOpen = false" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form ref="eventForm" @submit.prevent="saveEvent" class="q-gutter-md">
            <q-input
              v-model="form.namaEvent"
              label="Nama Event / Kegiatan"
              outlined
              dense
              placeholder="Contoh: Ibadah Raya 1, Latihan Pemusik, Komsel..."
              :rules="[val => !!val || 'Nama event wajib diisi']"
            />
            
            <q-select
              v-model="form.jenisEvent"
              :options="jenisEventOptions"
              label="Jenis Kegiatan"
              outlined
              dense
              :rules="[val => !!val || 'Jenis kegiatan wajib diisi']"
            />

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.tanggal"
                  label="Tanggal"
                  type="date"
                  outlined
                  dense
                  stack-label
                  :rules="[val => !!val || 'Tanggal wajib diisi']"
                />
              </div>
              <div class="col-6 col-sm-3">
                <q-input
                  v-model="form.jamMulai"
                  label="Jam Mulai"
                  type="time"
                  outlined
                  dense
                  stack-label
                  :rules="[val => !!val || 'Wajib diisi']"
                />
              </div>
              <div class="col-6 col-sm-3">
                <q-input
                  v-model="form.jamSelesai"
                  label="Jam Selesai"
                  type="time"
                  outlined
                  dense
                  stack-label
                />
              </div>
            </div>

            <q-input
              v-model="form.lokasi"
              label="Lokasi Pelaksanaan"
              outlined
              dense
              placeholder="Contoh: Ruang Utama, Aula Lantai 2, Rumah Bpk. X..."
            />

            <q-input
              v-model="form.catatan"
              label="Catatan / Keterangan Tambahan"
              type="textarea"
              outlined
              dense
              autogrow
              placeholder="Tulis instruksi pelayanan atau catatan lainnya..."
            />
          </q-form>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Batal" color="primary" @click="dialogOpen = false" />
          <q-btn
            unelevated
            color="primary"
            :label="editingEvent ? 'Simpan' : 'Buat Event'"
            :loading="saving"
            @click="saveEvent"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useEventStore } from 'stores/event'
import { usePresensiStore } from 'stores/presensi'
import { useSessionStore } from 'stores/session'
import { useJemaatStore } from 'stores/jemaat'
import { useQuasar } from 'quasar'

const eventStore = useEventStore()
const presensiStore = usePresensiStore()
const sessionStore = useSessionStore()
const jemaatStore = useJemaatStore()
const $q = useQuasar()

const search = ref('')
const tab = ref('wilayah')
const selectedEvent = ref(null)
const loadingStats = ref(false)
const dialogOpen = ref(false)
const editingEvent = ref(null)
const saving = ref(false)
const eventForm = ref(null)

const form = ref({
  namaEvent: '',
  jenisEvent: 'Ibadah Raya',
  tanggal: new Date().toISOString().slice(0, 10),
  jamMulai: '08:00',
  jamSelesai: '',
  lokasi: '',
  catatan: ''
})

const isViewer = computed(() => sessionStore.currentUser?.roleCode === 'viewer')

const jenisEventOptions = [
  'Ibadah Raya',
  'Ibadah Pemuda',
  'Komsel',
  'Sekolah Minggu',
  'Latihan Musik',
  'Rapat',
  'Lainnya'
]

const filteredEvents = computed(() => {
  const keyword = search.value.toLowerCase().trim()
  return eventStore.listEvents.filter(evt => {
    return !keyword ||
      evt.namaEvent.toLowerCase().includes(keyword) ||
      evt.jenisEvent.toLowerCase().includes(keyword) ||
      (evt.lokasi && evt.lokasi.toLowerCase().includes(keyword))
  })
})

const totalHadir = computed(() => presensiStore.totalHadir)
const listPresensi = computed(() => presensiStore.listPresensi)
const rekapWilayah = computed(() => presensiStore.rekapWilayah)

const attendancePercentage = computed(() => {
  const totalJemaat = jemaatStore.listJemaat.filter(j => j.status === 'Aktif').length
  if (totalJemaat === 0) return 0
  return Math.round((totalHadir.value / totalJemaat) * 100)
})

const selectEvent = async (evt) => {
  selectedEvent.value = evt
  loadingStats.value = true
  try {
    await presensiStore.loadPresensi(evt.id)
  } catch (error) {
    console.error(error)
  } finally {
    loadingStats.value = false
  }
}

const openAddDialog = () => {
  editingEvent.value = null
  form.value = {
    namaEvent: '',
    jenisEvent: 'Ibadah Raya',
    tanggal: new Date().toISOString().slice(0, 10),
    jamMulai: new Date().toTimeString().slice(0, 5),
    jamSelesai: '',
    lokasi: '',
    catatan: ''
  }
  dialogOpen.value = true
}

const openEditDialog = (evt) => {
  editingEvent.value = evt
  form.value = {
    namaEvent: evt.namaEvent,
    jenisEvent: evt.jenisEvent,
    tanggal: evt.tanggal,
    jamMulai: evt.jamMulai,
    jamSelesai: evt.jamSelesai || '',
    lokasi: evt.lokasi || '',
    catatan: evt.catatan || ''
  }
  dialogOpen.value = true
}

const saveEvent = async () => {
  const isValid = await eventForm.value?.validate()
  if (!isValid) return

  saving.value = true
  try {
    if (editingEvent.value) {
      const updated = await eventStore.updateEvent(editingEvent.value.id, form.value)
      if (selectedEvent.value?.id === editingEvent.value.id) {
        selectedEvent.value = updated
      }
      $q.notify({ type: 'positive', message: 'Event berhasil diperbarui.' })
    } else {
      await eventStore.createEvent(form.value)
      $q.notify({ type: 'positive', message: 'Event baru berhasil ditambahkan.' })
    }
    dialogOpen.value = false
  } catch (error) {
    $q.notify({ type: 'negative', message: `Gagal menyimpan event: ${error.message || error}` })
  } finally {
    saving.value = false
  }
}

const confirmStart = (evt) => {
  $q.dialog({
    title: 'Mulai Sesi Ibadah',
    message: `Apakah Anda yakin ingin memulai sesi "${evt.namaEvent}"? Ini akan mengaktifkan presensi jemaat.`,
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Mulai Sesi', color: 'positive', unelevated: true },
    persistent: true
  }).onOk(async () => {
    try {
      const updated = await eventStore.startSesi(evt.id)
      if (selectedEvent.value?.id === evt.id) {
        selectedEvent.value = updated
      }
      $q.notify({ type: 'positive', message: 'Sesi ibadah berhasil diaktifkan!' })
    } catch (error) {
      $q.notify({ type: 'negative', message: error.message || 'Gagal memulai sesi.' })
    }
  })
}

const confirmFinish = (evt) => {
  $q.dialog({
    title: 'Selesai Sesi Ibadah',
    message: `Apakah Anda yakin ingin mengunci presensi dan menyelesaikan sesi "${evt.namaEvent}"?`,
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Selesaikan', color: 'dark', unelevated: true },
    persistent: true
  }).onOk(async () => {
    try {
      const updated = await eventStore.finishSesi(evt.id)
      if (selectedEvent.value?.id === evt.id) {
        selectedEvent.value = updated
      }
      $q.notify({ type: 'positive', message: 'Sesi ibadah selesai dan presensi dikunci.' })
    } catch (error) {
      $q.notify({ type: 'negative', message: error.message || 'Gagal menyelesaikan sesi.' })
    }
  })
}

const confirmDelete = (evt) => {
  $q.dialog({
    title: 'Hapus Event',
    message: `Apakah Anda yakin ingin menghapus event "${evt.namaEvent}"?`,
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Hapus', color: 'negative', unelevated: true },
    persistent: true
  }).onOk(async () => {
    try {
      await eventStore.deleteEvent(evt.id)
      if (selectedEvent.value?.id === evt.id) {
        selectedEvent.value = null
      }
      $q.notify({ type: 'positive', message: 'Event berhasil dihapus.' })
    } catch (error) {
      $q.notify({ type: 'negative', message: error.message || 'Gagal menghapus event.' })
    }
  })
}

const getStatusColor = (status) => {
  if (status === 'active') return 'positive'
  if (status === 'finished') return 'grey-7'
  if (status === 'cancelled') return 'negative'
  return 'primary'
}

const getStatusChipColor = (status) => {
  if (status === 'active') return 'positive'
  if (status === 'finished') return 'grey-3'
  if (status === 'cancelled') return 'red-2'
  return 'blue-1'
}

const getStatusLabel = (status) => {
  if (status === 'active') return 'Aktif (Presensi)'
  if (status === 'finished') return 'Selesai'
  if (status === 'cancelled') return 'Dibatalkan'
  return 'Draft'
}

const getEventIcon = (jenis) => {
  if (jenis === 'Ibadah Raya') return 'church'
  if (jenis === 'Ibadah Pemuda') return 'star'
  if (jenis === 'Komsel') return 'people'
  if (jenis === 'Sekolah Minggu') return 'child_care'
  if (jenis === 'Latihan Musik') return 'music_note'
  return 'event'
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

onMounted(() => {
  eventStore.loadEvents()
  jemaatStore.loadJemaat()
})
</script>

<style lang="scss" scoped>
.page-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 16px;
}
.bg-blue-0 {
  background-color: rgba(33, 150, 243, 0.08);
}
.bg-teal-0 {
  background-color: rgba(0, 150, 136, 0.08);
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
