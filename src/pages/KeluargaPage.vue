<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-col-gutter-sm page-header">
      <div>
        <div class="text-h5 text-weight-bold text-grey-9">Manajemen Keluarga</div>
        <div class="text-caption text-grey-6">Kelola data keluarga, alamat, penanggung jawab/kepala keluarga, dan anggota jemaat terikat</div>
      </div>
      <q-btn
        v-if="!isViewer"
        color="primary"
        unelevated
        icon="add"
        label="Tambah Keluarga"
        style="border-radius: 8px;"
        @click="openAddDialog"
      />
    </div>

    <!-- Search & Filter Card -->
    <q-card flat bordered class="q-mt-md shadow-1" style="border-radius: 12px;">
      <q-card-section class="q-pa-md">
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-6">
            <q-input
              v-model="search"
              dense
              outlined
              placeholder="Cari keluarga berdasarkan nama, kepala keluarga, atau alamat..."
              clearable
              style="border-radius: 8px;"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6 col-md-4">
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

    <!-- Content Card -->
    <q-card flat bordered class="q-mt-lg shadow-1" style="border-radius: 12px;">
      <!-- Loading -->
      <div v-if="keluargaStore.loading" class="flex flex-center q-pa-xl">
        <q-spinner color="primary" size="40px" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredKeluarga.length === 0" class="text-center q-pa-xl flex flex-center column">
        <q-icon name="home" size="56px" color="grey-5" />
        <div class="text-subtitle1 text-weight-medium text-grey-8 q-mt-md">Tidak Ada Keluarga</div>
        <div class="text-caption text-grey-6 q-mt-xs">
          Belum ada data keluarga terdaftar atau ubah pencarian/filter wilayah Anda.
        </div>
      </div>

      <!-- Desktop View (Table) -->
      <div v-else-if="!$q.screen.lt.md">
        <q-table
          :rows="filteredKeluarga"
          :columns="columns"
          row-key="id"
          flat
          dense
          :rows-per-page-options="[10, 20]"
        >
          <template #body-cell-actions="props">
            <q-td :props="props" class="q-gutter-xs">
              <q-btn
                v-if="!isViewer"
                flat
                round
                dense
                color="secondary"
                icon="edit"
                @click="openEditDialog(props.row)"
              />
              <q-btn
                v-if="!isViewer"
                flat
                round
                dense
                color="negative"
                icon="delete"
                @click="confirmDelete(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </div>

      <!-- Mobile View (Cards) -->
      <div v-else class="q-pa-md row q-col-gutter-sm">
        <div v-for="k in filteredKeluarga" :key="k.id" class="col-12">
          <q-card flat bordered style="border-radius: 10px; border-left: 4px solid var(--q-primary);">
            <q-card-section class="q-pa-md">
              <div class="row items-center justify-between no-wrap">
                <div class="text-subtitle2 text-weight-bold text-grey-9">{{ k.namaKeluarga }}</div>
                <q-chip color="teal" text-color="white" size="xs" class="text-weight-bold">
                  {{ k.totalAnggota }} Anggota
                </q-chip>
              </div>
              <div class="text-caption text-grey-7 q-mt-sm">
                <strong>Kepala Keluarga:</strong> {{ k.kepalaKeluarga || '-' }}
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">
                <strong>Wilayah:</strong> {{ k.namaWilayah }}
              </div>
              <div class="text-caption text-grey-7 q-mt-xs" v-if="k.alamat">
                <strong>Alamat:</strong> {{ k.alamat }}
              </div>
              <div class="text-caption text-grey-7 q-mt-xs" v-if="k.noHpKeluarga">
                <strong>Kontak:</strong> {{ k.noHpKeluarga }}
              </div>
              <div v-if="!isViewer" class="row justify-end q-mt-sm q-gutter-sm">
                <q-btn flat round size="sm" color="secondary" icon="edit" @click="openEditDialog(k)" />
                <q-btn flat round size="sm" color="negative" icon="delete" @click="confirmDelete(k)" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </q-card>

    <!-- Dialog Form -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 320px; width: 100%; max-width: 500px; border-radius: 12px;">
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1 text-weight-bold">
            {{ editingKeluarga ? 'Edit Data Keluarga' : 'Tambah Keluarga Baru' }}
          </div>
          <q-btn flat round icon="close" @click="dialogOpen = false" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form ref="kelForm" @submit.prevent="saveKeluarga" class="q-gutter-md">
            <q-input
              v-model="form.namaKeluarga"
              label="Nama Keluarga (contoh: Keluarga Mantiri)"
              outlined
              dense
              :rules="[val => !!val || 'Nama keluarga wajib diisi']"
            />
            <q-select
              v-model="form.wilayahId"
              :options="wilayahOptions"
              label="Pilih Wilayah"
              emit-value
              map-options
              outlined
              dense
              :rules="[val => !!val || 'Wilayah wajib dipilih']"
            />
            <q-input
              v-model="form.kepalaKeluarga"
              label="Nama Kepala Keluarga (Opsional)"
              outlined
              dense
            />
            <q-input
              v-model="form.noHpKeluarga"
              label="No. HP Keluarga"
              outlined
              dense
              mask="#############"
            />
            <q-input
              v-model="form.alamat"
              label="Alamat Keluarga"
              type="textarea"
              outlined
              dense
              autogrow
            />
            <q-input
              v-model="form.catatan"
              label="Catatan"
              type="textarea"
              outlined
              dense
              autogrow
            />
          </q-form>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Batal" color="primary" @click="dialogOpen = false" />
          <q-btn
            unelevated
            color="primary"
            :label="editingKeluarga ? 'Simpan' : 'Tambah'"
            :loading="saving"
            @click="saveKeluarga"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useKeluargaStore } from 'stores/keluarga'
import { useWilayahStore } from 'stores/wilayah'
import { useSessionStore } from 'stores/session'
import { useQuasar } from 'quasar'

const keluargaStore = useKeluargaStore()
const wilayahStore = useWilayahStore()
const sessionStore = useSessionStore()
const $q = useQuasar()

const search = ref('')
const selectedWilayah = ref(null)
const dialogOpen = ref(false)
const editingKeluarga = ref(null)
const saving = ref(false)
const kelForm = ref(null)

const form = ref({
  namaKeluarga: '',
  wilayahId: null,
  kepalaKeluarga: '',
  noHpKeluarga: '',
  alamat: '',
  catatan: ''
})

const isViewer = computed(() => sessionStore.currentUser?.roleCode === 'viewer')

const columns = [
  { name: 'namaKeluarga', label: 'Nama Keluarga', align: 'left', field: 'namaKeluarga', sortable: true },
  { name: 'namaWilayah', label: 'Wilayah', align: 'left', field: 'namaWilayah', sortable: true },
  { name: 'kepalaKeluarga', label: 'Kepala Keluarga', align: 'left', field: 'kepalaKeluarga', sortable: true },
  { name: 'noHpKeluarga', label: 'Telepon', align: 'left', field: 'noHpKeluarga' },
  { name: 'alamat', label: 'Alamat', align: 'left', field: 'alamat' },
  { name: 'totalAnggota', label: 'Anggota Jemaat', align: 'center', field: 'totalAnggota', sortable: true },
  { name: 'actions', label: 'Aksi', align: 'right' }
]

const wilayahOptions = computed(() => {
  return wilayahStore.listWilayah.map(w => ({
    label: w.nama,
    value: w.id
  }))
})

const filteredKeluarga = computed(() => {
  const keyword = search.value.toLowerCase().trim()
  return keluargaStore.listKeluarga.filter(k => {
    const matchesKeyword = !keyword ||
      k.namaKeluarga.toLowerCase().includes(keyword) ||
      (k.kepalaKeluarga && k.kepalaKeluarga.toLowerCase().includes(keyword)) ||
      (k.alamat && k.alamat.toLowerCase().includes(keyword))
    
    const matchesWilayah = !selectedWilayah.value || k.wilayahId === selectedWilayah.value

    return matchesKeyword && matchesWilayah
  })
})

const openAddDialog = () => {
  editingKeluarga.value = null
  form.value = {
    namaKeluarga: '',
    wilayahId: null,
    kepalaKeluarga: '',
    noHpKeluarga: '',
    alamat: '',
    catatan: ''
  }
  dialogOpen.value = true
}

const openEditDialog = (row) => {
  editingKeluarga.value = row
  form.value = {
    namaKeluarga: row.namaKeluarga,
    wilayahId: row.wilayahId,
    kepalaKeluarga: row.kepalaKeluarga || '',
    noHpKeluarga: row.noHpKeluarga || '',
    alamat: row.alamat || '',
    catatan: row.catatan || ''
  }
  dialogOpen.value = true
}

const saveKeluarga = async () => {
  const isValid = await kelForm.value?.validate()
  if (!isValid) return

  saving.value = true
  try {
    if (editingKeluarga.value) {
      await keluargaStore.updateKeluarga(editingKeluarga.value.id, form.value)
      $q.notify({ type: 'positive', message: 'Keluarga berhasil diperbarui!' })
    } else {
      await keluargaStore.createKeluarga(form.value)
      $q.notify({ type: 'positive', message: 'Keluarga baru berhasil ditambahkan!' })
    }
    dialogOpen.value = false
  } catch (error) {
    $q.notify({ type: 'negative', message: `Gagal menyimpan keluarga: ${error.message || error}` })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (row) => {
  $q.dialog({
    title: 'Konfirmasi Hapus',
    message: `Apakah Anda yakin ingin menghapus data keluarga "${row.namaKeluarga}"?`,
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Hapus', color: 'negative', unelevated: true },
    persistent: true
  }).onOk(async () => {
    try {
      await keluargaStore.deleteKeluarga(row.id)
      $q.notify({ type: 'positive', message: 'Keluarga berhasil dihapus.' })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.message || 'Gagal menghapus keluarga.',
        position: 'top'
      })
    }
  })
}

onMounted(() => {
  keluargaStore.loadKeluarga()
  wilayahStore.loadWilayah()
})
</script>

<style lang="scss" scoped>
.page-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 16px;
}
</style>
