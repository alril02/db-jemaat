<template>
  <q-page class="page-dashboard">
    <div class="page-header">
      <div>
        <div class="text-h5 text-weight-bold">Data Jemaat</div>
        <div class="text-caption text-grey-6">
          Daftar lengkap jemaat, keluarga, dan kehadiran ibadah minggu
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn
          color="primary"
          unelevated
          icon="person_add"
          label="Tambah Jemaat"
          @click="formDialog = true"
        />
      </div>
    </div>

    <div class="row q-col-gutter-lg q-mt-md">
      <div class="col-12 col-md-6 col-lg-3" v-for="metric in metrics" :key="metric.label">
        <q-card flat bordered class="stat-card">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-grey-6">{{ metric.label }}</div>
              <div class="text-h6 text-weight-bold q-mt-xs">{{ metric.value }}</div>
              <div class="text-caption" :class="metric.trendClass">
                <q-icon :name="metric.trendIcon" size="16px" class="q-mr-xs" />
                {{ metric.trend }}
              </div>
            </div>
            <q-avatar size="44px" :color="metric.iconBg" text-color="white">
              <q-icon :name="metric.icon" />
            </q-avatar>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card flat bordered class="content-card q-mt-lg">
      <q-card-section class="row items-center q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-input v-model="search" dense outlined placeholder="Cari nama, keluarga, wilayah">
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="selectedArea"
            :options="areaOptions"
            dense
            outlined
            label="Wilayah"
            emit-value
            map-options
            clearable
          />
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="selectedStatus"
            :options="statusOptions"
            dense
            outlined
            label="Status"
            emit-value
            map-options
            clearable
          />
        </div>
        <div class="col-12 col-md-2">
          <q-btn outline color="primary" class="full-width" icon="refresh" label="Reset" @click="resetFilter" />
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="content-card q-mt-lg">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">Daftar Jemaat</div>
          <div class="text-caption text-grey-6">Menampilkan data terbaru</div>
        </div>
        <q-btn flat color="primary" icon="download" label="Ekspor" />
      </q-card-section>
      <q-separator />
      <q-table
        :rows="filteredRows"
        :columns="columns"
        row-key="id"
        flat
        bordered
        class="table-jemaat"
        :rows-per-page-options="[5, 10, 20]"
        :pagination="pagination"
      >
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-chip
              :color="statusColor(props.value)"
              text-color="white"
              size="sm"
              class="text-weight-medium"
            >
              {{ props.value }}
            </q-chip>
          </q-td>
        </template>
        <template #body-cell-attendance="props">
          <q-td :props="props">
            <q-chip
              :color="props.row.attendanceRate >= 80 ? 'positive' : props.row.attendanceRate >= 60 ? 'warning' : 'negative'"
              text-color="white"
              size="sm"
            >
              {{ props.row.attendanceRate }}% - {{ props.row.attendanceNote }}
            </q-chip>
          </q-td>
        </template>
        <template #body-cell-name="props">
          <q-td :props="props">
            <q-btn
              flat
              dense
              color="primary"
              class="q-pa-none"
              @click="openDetail(props.row)"
            >
              <span class="text-weight-medium">{{ props.value }}</span>
            </q-btn>
            <div class="text-caption text-grey-6">{{ props.row.phone }}</div>
          </q-td>
        </template>
        <template #body-cell-family="props">
          <q-td :props="props">
            <q-btn
              flat
              dense
              color="primary"
              class="q-pa-none"
              @click="openFamilyDetail(props.row.family)"
            >
              <span class="text-weight-medium">{{ props.value }}</span>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <FormTambahJemaat v-model="formDialog" />
    <DetailJemaatDialog v-model="detailDialog" :member="selectedMember" />
    <DetailKeluargaDialog
      v-model="familyDialog"
      :family-name="selectedFamily"
      :members="familyMembers"
    />

  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import FormTambahJemaat from 'components/FormTambahJemaat.vue'
import DetailJemaatDialog from 'components/DetailJemaatDialog.vue'
import DetailKeluargaDialog from 'components/DetailKeluargaDialog.vue'

const search = ref('')
const selectedArea = ref(null)
const selectedStatus = ref(null)

const pagination = ref({ page: 1, rowsPerPage: 5 })
const formDialog = ref(false)
const detailDialog = ref(false)
const selectedMember = ref(null)
const familyDialog = ref(false)
const selectedFamily = ref('')

const metrics = [
  {
    label: 'Total Jemaat',
    value: '2.438',
    trend: '+4.3% bulan ini',
    trendIcon: 'trending_up',
    trendClass: 'text-positive',
    icon: 'groups',
    iconBg: 'primary'
  },
  {
    label: 'Keluarga Terdata',
    value: '612',
    trend: '+12 keluarga baru',
    trendIcon: 'add_circle',
    trendClass: 'text-positive',
    icon: 'home',
    iconBg: 'deep-purple'
  },
  {
    label: 'Kehadiran Minggu Ini',
    value: '86%',
    trend: '+2.1% dari minggu lalu',
    trendIcon: 'trending_up',
    trendClass: 'text-positive',
    icon: 'event_available',
    iconBg: 'teal'
  },
  {
    label: 'Jemaat Perlu Tindak Lanjut',
    value: '24',
    trend: '6 jemaat baru',
    trendIcon: 'warning',
    trendClass: 'text-warning',
    icon: 'priority_high',
    iconBg: 'orange'
  }
]

const areaOptions = [
  { label: 'Wilayah Paal 2', value: 'Paal 2' },
  { label: 'Wilayah Malalayang', value: 'Malalayang' },
  { label: 'Wilayah Tikala', value: 'Tikala' },
  { label: 'Wilayah Tuminting', value: 'Tuminting' }
]

const statusOptions = [
  { label: 'Aktif', value: 'Aktif' },
  { label: 'Pindah', value: 'Pindah' },
  { label: 'Nonaktif', value: 'Nonaktif' }
]

const rows = [
  {
    id: 1,
    name: 'Yonathan Mantiri',
    gender: 'L',
    birthPlace: 'Manado',
    birthDate: '1991-04-12',
    phone: '0812-3456-9901',
    email: 'yonathan.mantiri@mail.com',
    area: 'Malalayang',
    family: 'Keluarga Mantiri',
    status: 'Aktif',
    membership: 'Anggota',
    baptismDate: '2009-05-12',
    address: 'Perumahan Malalayang Permai Blok C3',
    notes: 'Pelayan musik',
    emergencyContact: 'Rey Mantiri - 0813-1122-3434',
    attendanceRate: 92,
    attendanceNote: 'Hadir Minggu lalu',
    photo: 'https://cdn.quasar.dev/img/avatar1.jpg'
  },
  {
    id: 2,
    name: 'Ruth Tumiwa',
    gender: 'P',
    birthPlace: 'Tomohon',
    birthDate: '1996-09-30',
    phone: '0821-4567-8032',
    email: 'ruth.tumiwa@mail.com',
    area: 'Paal 2',
    family: 'Keluarga Tumiwa',
    status: 'Aktif',
    membership: 'Anggota',
    baptismDate: '2013-02-14',
    address: 'Jl. Raya Paal 2 No. 21',
    notes: 'Koordinator Komsel',
    emergencyContact: 'Eva Tumiwa - 0821-4432-1122',
    attendanceRate: 86,
    attendanceNote: 'Hadir Minggu lalu',
    photo: 'https://cdn.quasar.dev/img/avatar2.jpg'
  },
  {
    id: 3,
    name: 'Grace Poluan',
    gender: 'P',
    birthPlace: 'Airmadidi',
    birthDate: '2002-01-18',
    phone: '0813-8822-7788',
    email: 'grace.poluan@mail.com',
    area: 'Tikala',
    family: 'Keluarga Poluan',
    status: 'Aktif',
    membership: 'Simpatisan',
    baptismDate: '',
    address: 'Kompleks Tikala Elok Blok B5',
    notes: 'Persiapan baptisan',
    emergencyContact: 'Riko Poluan - 0813-1122-0098',
    attendanceRate: 78,
    attendanceNote: 'Hadir 2 minggu lalu',
    photo: 'https://cdn.quasar.dev/img/avatar3.jpg'
  },
  {
    id: 4,
    name: 'Rio Langi',
    gender: 'L',
    birthPlace: 'Bitung',
    birthDate: '1988-12-05',
    phone: '0852-7612-2299',
    email: 'rio.langi@mail.com',
    area: 'Tuminting',
    family: 'Keluarga Langi',
    status: 'Nonaktif',
    membership: 'Anggota',
    baptismDate: '2005-08-21',
    address: 'Jl. Tuminting Utara No. 9',
    notes: 'Perlu kunjungan',
    emergencyContact: 'Ina Langi - 0852-4431-2244',
    attendanceRate: 42,
    attendanceNote: 'Belum hadir 1 bulan',
    photo: 'https://cdn.quasar.dev/img/avatar4.jpg'
  },
  {
    id: 5,
    name: 'Maria Liow',
    gender: 'P',
    birthPlace: 'Manado',
    birthDate: '1994-03-02',
    phone: '0812-9900-1122',
    email: 'maria.liow@mail.com',
    area: 'Paal 2',
    family: 'Keluarga Liow',
    status: 'Aktif',
    membership: 'Anggota',
    baptismDate: '2010-11-14',
    address: 'Kompleks Paal 2 Indah No. 7',
    notes: 'Pelayan multimedia',
    emergencyContact: 'Sari Liow - 0812-7766-3344',
    attendanceRate: 88,
    attendanceNote: 'Hadir Minggu lalu',
    photo: 'https://cdn.quasar.dev/img/avatar5.jpg'
  }
]

const columns = [
  {
    name: 'name',
    label: 'Nama Jemaat',
    align: 'left',
    field: 'name',
    sortable: true
  },
  {
    name: 'area',
    label: 'Wilayah',
    align: 'left',
    field: 'area',
    sortable: true
  },
  {
    name: 'family',
    label: 'Keluarga',
    align: 'left',
    field: 'family'
  },
  {
    name: 'status',
    label: 'Status',
    align: 'left',
    field: 'status'
  },
  {
    name: 'membership',
    label: 'Keanggotaan',
    align: 'left',
    field: 'membership'
  },
  {
    name: 'attendance',
    label: 'Kehadiran Minggu',
    align: 'left',
    field: 'attendanceRate'
  }
]

const filteredRows = computed(() => {
  const keyword = search.value.toLowerCase()
  return rows.filter((row) => {
    const matchesKeyword =
      row.name.toLowerCase().includes(keyword) ||
      row.family.toLowerCase().includes(keyword) ||
      row.area.toLowerCase().includes(keyword)

    const matchesArea = selectedArea.value ? row.area === selectedArea.value : true
    const matchesStatus = selectedStatus.value ? row.status === selectedStatus.value : true

    return matchesKeyword && matchesArea && matchesStatus
  })
})

const resetFilter = () => {
  search.value = ''
  selectedArea.value = null
  selectedStatus.value = null
}

const openDetail = (member) => {
  selectedMember.value = member
  detailDialog.value = true
}

const familyMembers = computed(() => {
  if (!selectedFamily.value) return []
  return rows.filter((row) => row.family === selectedFamily.value)
})

const openFamilyDetail = (familyName) => {
  selectedFamily.value = familyName
  familyDialog.value = true
}

const statusColor = (status) => {
  if (status === 'Aktif') return 'positive'
  if (status === 'Pindah') return 'warning'
  return 'negative'
}
</script>
