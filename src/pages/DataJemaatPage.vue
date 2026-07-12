<template>
  <q-page class="page-dashboard q-pa-md">
    <!-- Page Header -->
    <div class="page-header row items-center justify-between q-col-gutter-sm">
      <div>
        <div class="text-h5 text-weight-bold text-grey-9">Data Jemaat</div>
        <div class="text-caption text-grey-6">
          Daftar lengkap jemaat, keluarga, dan status kehadiran ibadah
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
          @click="openAddForm"
        />
        <q-btn
          outline
          color="primary"
          icon="cloud_upload"
          label="Impor CSV"
          style="border-radius: 8px;"
          @click="importCsvDialog = true"
        />
      </div>
    </div>

    <!-- Quick Metrics -->
    <div class="row q-col-gutter-md q-mt-md">
      <div class="col-12 col-sm-6 col-md-3" v-for="metric in metrics" :key="metric.label">
        <q-card flat bordered class="stat-card shadow-1" style="border-radius: 12px; height: 100%;">
          <q-card-section class="row items-center justify-between no-wrap">
            <div>
              <div class="text-caption text-grey-6 text-weight-medium">{{ metric.label }}</div>
              <div class="text-h5 text-weight-bold text-grey-9 q-mt-xs">{{ metric.value }}</div>
              <div class="text-caption text-weight-medium q-mt-xs" :class="metric.trendClass">
                <q-icon :name="metric.trendIcon" size="16px" class="q-mr-xs" />
                {{ metric.trend }}
              </div>
            </div>
            <q-avatar size="44px" :color="metric.iconBg" text-color="white" class="shadow-1">
              <q-icon :name="metric.icon" />
            </q-avatar>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Search & Main Filters Card -->
    <q-card flat bordered class="content-card q-mt-lg shadow-1" style="border-radius: 12px;">
      <q-card-section class="q-pa-md">
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-4">
            <q-input
              v-model="search"
              dense
              outlined
              placeholder="Cari nama, keluarga, wilayah, atau no HP..."
              style="border-radius: 8px;"
              clearable
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="selectedWilayah"
              :options="areaOptions"
              dense
              outlined
              label="Wilayah"
              emit-value
              map-options
              clearable
              style="border-radius: 8px;"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="selectedStatus"
              :options="statusOptions"
              dense
              outlined
              label="Status Jemaat"
              emit-value
              map-options
              clearable
              style="border-radius: 8px;"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-btn
              outline
              color="primary"
              class="full-width"
              icon="refresh"
              label="Reset"
              style="border-radius: 8px; height: 40px;"
              @click="resetFilter"
            />
          </div>
        </div>

        <!-- Expansion Item for Advanced Filters -->
        <q-expansion-item
          icon="tune"
          label="Filter Lanjutan & Urutan"
          header-class="text-weight-bold text-grey-8"
          class="q-mt-sm border-top"
          dense
        >
          <div class="row q-col-gutter-md q-pt-md q-pb-sm">
            <div class="col-12 col-sm-4 col-md-3">
              <q-select
                v-model="selectedGender"
                :options="genderOptions"
                dense
                outlined
                label="Jenis Kelamin"
                emit-value
                map-options
                clearable
              />
            </div>
            <div class="col-12 col-sm-4 col-md-3">
              <q-select
                v-model="selectedMembership"
                :options="membershipOptions"
                dense
                outlined
                label="Keanggotaan"
                emit-value
                map-options
                clearable
              />
            </div>
            <div class="col-12 col-sm-4 col-md-3">
              <q-select
                v-model="selectedBaptism"
                :options="baptismOptions"
                dense
                outlined
                label="Status Baptisan"
                emit-value
                map-options
                clearable
              />
            </div>
            <div class="col-12 col-sm-12 col-md-3">
              <q-select
                v-model="sortBy"
                :options="sortOptions"
                dense
                outlined
                label="Urutkan Berdasarkan"
                emit-value
                map-options
              />
            </div>
          </div>
        </q-expansion-item>
      </q-card-section>
    </q-card>

    <!-- Content Card -->
    <q-card flat bordered class="content-card q-mt-lg shadow-1" style="border-radius: 12px;">
      <q-card-section class="row items-center justify-between q-pa-md">
        <div>
          <div class="text-subtitle1 text-weight-bold text-grey-9">Daftar Jemaat</div>
          <div class="text-caption text-grey-6">Menampilkan {{ filteredRows.length }} data jemaat</div>
        </div>
        <q-btn
          flat
          color="primary"
          icon="download"
          label="Ekspor CSV"
          style="border-radius: 8px;"
          @click="exportCSV"
        />
      </q-card-section>
      
      <q-separator />

      <!-- Loading Indicator -->
      <div v-if="jemaatStore.loading" class="flex flex-center q-pa-xl">
        <q-spinner color="primary" size="40px" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredRows.length === 0" class="text-center q-pa-xl flex flex-center column">
        <q-icon name="search_off" size="56px" color="grey-5" />
        <div class="text-subtitle1 text-weight-medium text-grey-8 q-mt-md">Tidak Ada Data Jemaat</div>
        <div class="text-caption text-grey-6 q-mt-xs">
          Silakan coba ubah kata kunci pencarian atau bersihkan filter yang aktif.
        </div>
        <q-btn
          outline
          color="primary"
          label="Reset Filter"
          class="q-mt-md"
          style="border-radius: 8px;"
          @click="resetFilter"
        />
      </div>

      <!-- Desktop View (Table layout) -->
      <div v-else-if="!$q.screen.lt.md" class="q-pa-none">
        <q-table
          :rows="filteredRows"
          :columns="columns"
          row-key="id"
          flat
          class="table-jemaat font-body"
          :rows-per-page-options="[10, 20, 50]"
          v-model:pagination="pagination"
        >
          <!-- Status Column -->
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="statusColor(props.value)"
                text-color="white"
                size="sm"
                class="text-weight-bold"
              >
                {{ props.value }}
              </q-chip>
            </q-td>
          </template>

          <!-- Attendance Column -->
          <template #body-cell-attendance="props">
            <q-td :props="props">
              <q-chip
                :color="props.row.attendanceRate >= 80 ? 'positive' : props.row.attendanceRate >= 60 ? 'warning' : 'negative'"
                text-color="white"
                size="sm"
                class="text-weight-medium"
              >
                {{ props.row.attendanceRate }}%
              </q-chip>
              <span class="text-caption text-grey-6 q-ml-xs">{{ props.row.attendanceNote }}</span>
            </q-td>
          </template>

          <!-- Name Column -->
          <template #body-cell-name="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <q-avatar size="32px" class="q-mr-sm">
                  <img :src="props.row.photo" alt="avatar" />
                </q-avatar>
                <div>
                  <q-btn
                    flat
                    dense
                    color="primary"
                    class="q-pa-none text-weight-bold text-left"
                    @click="openDetail(props.row)"
                  >
                    <span>{{ props.value }}</span>
                  </q-btn>
                  <div class="text-caption text-grey-6">{{ props.row.phone }}</div>
                </div>
              </div>
            </q-td>
          </template>

          <!-- Family Column -->
          <template #body-cell-family="props">
            <q-td :props="props">
              <q-btn
                v-if="props.value"
                flat
                dense
                color="primary"
                class="q-pa-none text-weight-medium"
                @click="openFamilyDetail(props.value)"
              >
                <span>{{ props.value }}</span>
              </q-btn>
              <span v-else class="text-grey-5">-</span>
            </q-td>
          </template>
        </q-table>
      </div>

      <!-- Mobile View (Card List layout) -->
      <div v-else class="q-pa-md">
        <div class="row q-col-gutter-sm">
          <div
            v-for="row in paginatedRows"
            :key="row.id"
            class="col-12"
          >
            <q-card flat bordered class="jemaat-mobile-card shadow-sm q-pa-sm" style="border-radius: 10px;">
              <q-card-section class="row items-start no-wrap q-pa-xs">
                <q-avatar size="50px" class="shadow-1">
                  <img :src="row.photo" alt="avatar" />
                </q-avatar>
                <div class="q-ml-md col-grow">
                  <div class="row items-center justify-between no-wrap">
                    <div class="text-subtitle2 text-weight-bold text-grey-9 cursor-pointer" @click="openDetail(row)">
                      {{ row.name }}
                    </div>
                    <q-chip
                      :color="statusColor(row.status)"
                      text-color="white"
                      size="xs"
                      dense
                      class="text-weight-bold"
                    >
                      {{ row.status }}
                    </q-chip>
                  </div>
                  
                  <div class="text-caption text-grey-7 q-mt-xs">
                    <q-icon name="map" size="14px" class="q-mr-xs" /> {{ row.area }}
                  </div>
                  
                  <div class="text-caption text-grey-7 q-mt-xs">
                    <q-icon name="home" size="14px" class="q-mr-xs" /> {{ row.family || 'Belum ada keluarga' }}
                  </div>

                  <div class="text-caption text-grey-7 q-mt-xs">
                    <q-icon name="phone" size="14px" class="q-mr-xs" /> {{ row.phone }}
                  </div>

                  <div class="row items-center q-mt-sm justify-between">
                    <q-chip
                      :color="row.attendanceRate >= 80 ? 'positive' : row.attendanceRate >= 60 ? 'warning' : 'negative'"
                      text-color="white"
                      size="xs"
                      dense
                      class="text-weight-medium"
                    >
                      Hadir: {{ row.attendanceRate }}%
                    </q-chip>
                    
                    <div class="row q-gutter-xs">
                      <q-btn
                        flat
                        round
                        size="sm"
                        color="primary"
                        icon="info"
                        @click="openDetail(row)"
                      />
                      <q-btn
                        v-if="!isViewer"
                        flat
                        round
                        size="sm"
                        color="secondary"
                        icon="edit"
                        @click="openEditForm(row)"
                      />
                      <q-btn
                        flat
                        round
                        size="sm"
                        color="green"
                        icon="phone"
                        :href="`tel:${row.phone}`"
                      />
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Mobile Pagination: Load More -->
        <div v-if="filteredRows.length > paginatedRows.length" class="text-center q-mt-md">
          <q-btn
            outline
            color="primary"
            label="Muat Lebih Banyak"
            icon="expand_more"
            style="border-radius: 8px;"
            @click="loadMore"
          />
        </div>
      </div>
    </q-card>

    <!-- Dialogs -->
    <FormTambahJemaat v-model="formDialog" :member="editingMember" @saved="handleSaved" />
    <DetailJemaatDialog v-model="detailDialog" :member="selectedMember" @edit="openEditForm" />
    <DetailKeluargaDialog
      v-model="familyDialog"
      :family-name="selectedFamily"
      :members="familyMembers"
    />
    <ImportCsvDialog v-model="importCsvDialog" @imported="handleSaved" />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FormTambahJemaat from 'components/FormTambahJemaat.vue'
import DetailJemaatDialog from 'components/DetailJemaatDialog.vue'
import DetailKeluargaDialog from 'components/DetailKeluargaDialog.vue'
import ImportCsvDialog from 'components/ImportCsvDialog.vue'
import { useJemaatStore } from 'stores/jemaat'
import { useWilayahStore } from 'stores/wilayah'
import { useSessionStore } from 'stores/session'
import { useQuasar } from 'quasar'

const jemaatStore = useJemaatStore()
const wilayahStore = useWilayahStore()
const sessionStore = useSessionStore()
const $q = useQuasar()

// Main Filters
const search = computed({
  get: () => jemaatStore.searchKeyword,
  set: (value) => jemaatStore.setSearchKeyword(value),
})
const selectedWilayah = computed({
  get: () => jemaatStore.selectedWilayah,
  set: (value) => jemaatStore.setSelectedWilayah(value),
})
const selectedStatus = ref(null)

// Advanced Filters
const selectedGender = ref(null)
const selectedMembership = ref(null)
const selectedBaptism = ref(null)
const sortBy = ref('name_asc')

// Dialog controls
const formDialog = ref(false)
const detailDialog = ref(false)
const familyDialog = ref(false)
const importCsvDialog = ref(false)

const selectedFamily = ref('')
const editingMember = ref(null)

// Desktop Table Pagination
const pagination = ref({ page: 1, rowsPerPage: 10 })

// Mobile Card Pagination
const mobilePage = ref(1)
const mobileLimit = ref(10)

const isViewer = computed(() => sessionStore.currentUser?.roleCode === 'viewer')

const metrics = computed(() => {
  const families = new Set(jemaatStore.listJemaat.map((member) => member.family).filter(Boolean))
  const averageAttendance = jemaatStore.listJemaat.length
    ? Math.round(
        jemaatStore.listJemaat.reduce((acc, member) => acc + Number(member.attendanceRate || 0), 0) /
          jemaatStore.listJemaat.length,
      )
    : 0
  const lowAttendance = jemaatStore.listJemaat.filter((member) => Number(member.attendanceRate || 0) < 60).length

  return [
    {
      label: 'Total Jemaat',
      value: String(jemaatStore.totalJemaat),
      trend: 'Data aktif SQLite',
      trendIcon: 'groups',
      trendClass: 'text-positive',
      icon: 'groups',
      iconBg: 'primary',
    },
    {
      label: 'Keluarga Terdata',
      value: String(families.size),
      trend: 'Terhubung ke wilayah',
      trendIcon: 'home',
      trendClass: 'text-positive',
      icon: 'home',
      iconBg: 'deep-purple',
    },
    {
      label: 'Kehadiran Rata-rata',
      value: `${averageAttendance}%`,
      trend: 'Akumulasi presensi',
      trendIcon: 'event_available',
      trendClass: 'text-positive',
      icon: 'event_available',
      iconBg: 'teal',
    },
    {
      label: 'Perlu Tindak Lanjut',
      value: String(lowAttendance),
      trend: 'Kehadiran < 60%',
      trendIcon: 'warning',
      trendClass: 'text-warning',
      icon: 'priority_high',
      iconBg: 'orange',
    },
  ]
})

const areaOptions = computed(() =>
  wilayahStore.listWilayah.map((wilayah) => ({
    label: wilayah.nama,
    value: wilayah.nama,
  })),
)

const statusOptions = [
  { label: 'Aktif', value: 'Aktif' },
  { label: 'Pindah', value: 'Pindah' },
  { label: 'Nonaktif', value: 'Nonaktif' },
]

const genderOptions = [
  { label: 'Laki-laki', value: 'L' },
  { label: 'Perempuan', value: 'P' },
]

const membershipOptions = [
  { label: 'Anggota', value: 'Anggota' },
  { label: 'Simpatisan', value: 'Simpatisan' },
  { label: 'Tamu', value: 'Tamu' },
]

const baptismOptions = [
  { label: 'Sudah Baptis', value: 'sudah' },
  { label: 'Belum Baptis', value: 'belum' },
]

const sortOptions = [
  { label: 'Nama (A - Z)', value: 'name_asc' },
  { label: 'Nama (Z - A)', value: 'name_desc' },
  { label: 'Umur (Paling Tua)', value: 'age_desc' },
  { label: 'Umur (Paling Muda)', value: 'age_asc' },
]

const columns = [
  { name: 'name', label: 'Nama Jemaat', align: 'left', field: 'name', sortable: true },
  { name: 'area', label: 'Wilayah', align: 'left', field: 'area', sortable: true },
  { name: 'family', label: 'Keluarga', align: 'left', field: 'family' },
  { name: 'status', label: 'Status', align: 'left', field: 'status' },
  { name: 'membership', label: 'Keanggotaan', align: 'left', field: 'membership' },
  { name: 'attendance', label: 'Kehadiran', align: 'left', field: 'attendanceRate' }
]

// Advanced Filter & Sort Logic
const filteredRows = computed(() => {
  const keyword = search.value.toLowerCase().trim()
  return jemaatStore.listJemaat.filter((row) => {
    const haystack = [row.name, row.family, row.area, row.phone]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
    
    const matchesKeyword = keyword ? haystack.some((value) => value.includes(keyword)) : true
    const matchesArea = selectedWilayah.value ? row.area === selectedWilayah.value : true
    const matchesStatus = selectedStatus.value ? row.status === selectedStatus.value : true
    const matchesGender = selectedGender.value ? row.gender === selectedGender.value : true
    const matchesMembership = selectedMembership.value ? row.membership === selectedMembership.value : true
    
    let matchesBaptism = true
    if (selectedBaptism.value === 'sudah') {
      matchesBaptism = !!row.baptismDate && row.baptismDate !== ''
    } else if (selectedBaptism.value === 'belum') {
      matchesBaptism = !row.baptismDate || row.baptismDate === ''
    }

    return matchesKeyword && matchesArea && matchesStatus && matchesGender && matchesMembership && matchesBaptism
  }).sort((a, b) => {
    if (sortBy.value === 'name_asc') {
      return a.name.localeCompare(b.name)
    } else if (sortBy.value === 'name_desc') {
      return b.name.localeCompare(a.name)
    } else if (sortBy.value === 'age_asc') {
      return b.birthDate.localeCompare(a.birthDate)
    } else if (sortBy.value === 'age_desc') {
      return a.birthDate.localeCompare(b.birthDate)
    }
    return 0
  })
})

// Mobile paginated rows
const paginatedRows = computed(() => {
  return filteredRows.value.slice(0, mobilePage.value * mobileLimit.value)
})

const loadMore = () => {
  mobilePage.value++
}

const resetFilter = () => {
  search.value = ''
  selectedWilayah.value = ''
  selectedStatus.value = null
  selectedGender.value = null
  selectedMembership.value = null
  selectedBaptism.value = null
  sortBy.value = 'name_asc'
  mobilePage.value = 1
}

const openAddForm = () => {
  editingMember.value = null
  formDialog.value = true
}

const openEditForm = (member) => {
  editingMember.value = member
  formDialog.value = true
}

const openDetail = (member) => {
  jemaatStore.selectJemaat(member)
  detailDialog.value = true
}

const selectedMember = computed(() => jemaatStore.selectedJemaat)

const familyMembers = computed(() => {
  if (!selectedFamily.value) return []
  return jemaatStore.listJemaat.filter((row) => row.family === selectedFamily.value)
})

const openFamilyDetail = (familyName) => {
  selectedFamily.value = familyName
  familyDialog.value = true
}

const loadRows = async () => {
  await jemaatStore.loadJemaat()
  await wilayahStore.loadWilayah()
}

const handleSaved = async () => {
  await loadRows()
}

const statusColor = (status) => {
  if (status === 'Aktif') return 'positive'
  if (status === 'Pindah') return 'warning'
  return 'negative'
}

// CSV Export Utility
const exportCSV = () => {
  const headers = [
    'Nama Lengkap',
    'Jenis Kelamin',
    'Tempat Lahir',
    'Tanggal Lahir',
    'No HP',
    'Email',
    'Alamat',
    'Wilayah',
    'Keluarga',
    'Status Jemaat',
    'Keanggotaan',
    'Tanggal Baptis',
    'Kontak Darurat',
    'Catatan'
  ]

  const rows = jemaatStore.listJemaat.map(m => [
    m.fullName || m.name || '',
    m.gender || '',
    m.birthPlace || '',
    m.birthDate || '',
    m.phone || '',
    m.email || '',
    m.address || '',
    m.area || '',
    m.family || '',
    m.status || '',
    m.membership || '',
    m.baptismDate || '',
    m.emergencyContact || '',
    m.notes || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', `db_jemaat_ekspor_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  $q.notify({
    type: 'positive',
    message: 'Data jemaat berhasil diekspor ke file CSV!',
    position: 'top'
  })
}

onMounted(async () => {
  await loadRows()
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
.border-top {
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
}
.jemaat-mobile-card {
  border-left: 4px solid var(--q-primary);
  background-color: white;
}
</style>
