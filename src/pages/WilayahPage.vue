<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center justify-between q-col-gutter-sm page-header">
      <div>
        <div class="text-h5 text-weight-bold text-grey-9">Manajemen Wilayah</div>
        <div class="text-caption text-grey-6">Kelola rayon / wilayah jemaat untuk laporan dan pembagian koordinasi</div>
      </div>
      <q-btn
        v-if="!isViewer"
        color="primary"
        unelevated
        icon="add"
        label="Tambah Wilayah"
        style="border-radius: 8px;"
        @click="openAddDialog"
      />
    </div>

    <!-- Search Card -->
    <q-card flat bordered class="q-mt-md shadow-1" style="border-radius: 12px;">
      <q-card-section class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="search"
              dense
              outlined
              placeholder="Cari wilayah berdasarkan nama, kode, atau penanggung jawab..."
              clearable
              style="border-radius: 8px;"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Content Table / Card List -->
    <q-card flat bordered class="q-mt-lg shadow-1" style="border-radius: 12px;">
      <!-- Loading -->
      <div v-if="wilayahStore.loading" class="flex flex-center q-pa-xl">
        <q-spinner color="primary" size="40px" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredWilayah.length === 0" class="text-center q-pa-xl flex flex-center column">
        <q-icon name="map" size="56px" color="grey-5" />
        <div class="text-subtitle1 text-weight-medium text-grey-8 q-mt-md">Tidak Ada Wilayah</div>
        <div class="text-caption text-grey-6 q-mt-xs">
          Belum ada wilayah yang terdaftar atau ubah filter pencarian Anda.
        </div>
      </div>

      <!-- Desktop View (Table) -->
      <div v-else-if="!$q.screen.lt.md">
        <q-table
          :rows="filteredWilayah"
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
        <div v-for="w in filteredWilayah" :key="w.id" class="col-12">
          <q-card flat bordered style="border-radius: 10px; border-left: 4px solid var(--q-primary);">
            <q-card-section class="q-pa-md">
              <div class="row items-center justify-between no-wrap">
                <div class="text-subtitle2 text-weight-bold text-grey-9">{{ w.nama }}</div>
                <q-chip color="primary" outline size="xs" class="text-weight-bold">{{ w.kode }}</q-chip>
              </div>
              <div class="text-caption text-grey-7 q-mt-sm">
                <strong>Penanggung Jawab:</strong> {{ w.penanggungJawab || '-' }}
              </div>
              <div class="text-caption text-grey-6 q-mt-xs" v-if="w.catatan">
                <em>{{ w.catatan }}</em>
              </div>
              <div v-if="!isViewer" class="row justify-end q-mt-sm q-gutter-sm">
                <q-btn flat round size="sm" color="secondary" icon="edit" @click="openEditDialog(w)" />
                <q-btn flat round size="sm" color="negative" icon="delete" @click="confirmDelete(w)" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </q-card>

    <!-- Wilayah Dialog Form -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 320px; width: 100%; max-width: 450px; border-radius: 12px;">
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1 text-weight-bold">
            {{ editingWilayah ? 'Edit Wilayah' : 'Tambah Wilayah Baru' }}
          </div>
          <q-btn flat round icon="close" @click="dialogOpen = false" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form ref="wilForm" @submit.prevent="saveWilayah" class="q-gutter-md">
            <q-input
              v-model="form.nama"
              label="Nama Wilayah"
              outlined
              dense
              :rules="[val => !!val || 'Nama wajib diisi']"
            />
            <q-input
              v-model="form.kode"
              label="Kode Wilayah (contoh: MAL, TIK)"
              outlined
              dense
              mask="AAAAAA"
              :rules="[val => !!val || 'Kode wajib diisi']"
            />
            <q-input
              v-model="form.penanggungJawab"
              label="Penanggung Jawab"
              outlined
              dense
            />
            <q-input
              v-model="form.catatan"
              label="Catatan / Keterangan"
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
            :label="editingWilayah ? 'Simpan' : 'Tambah'"
            :loading="saving"
            @click="saveWilayah"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useWilayahStore } from 'stores/wilayah'
import { useSessionStore } from 'stores/session'
import { useQuasar } from 'quasar'

const wilayahStore = useWilayahStore()
const sessionStore = useSessionStore()
const $q = useQuasar()

const search = ref('')
const dialogOpen = ref(false)
const editingWilayah = ref(null)
const saving = ref(false)
const wilForm = ref(null)

const form = ref({
  nama: '',
  kode: '',
  penanggungJawab: '',
  catatan: ''
})

const isViewer = computed(() => sessionStore.currentUser?.roleCode === 'viewer')

const columns = [
  { name: 'nama', label: 'Nama Wilayah', align: 'left', field: 'nama', sortable: true },
  { name: 'kode', label: 'Kode', align: 'left', field: 'kode', sortable: true },
  { name: 'penanggungJawab', label: 'Penanggung Jawab', align: 'left', field: 'penanggungJawab', sortable: true },
  { name: 'catatan', label: 'Catatan', align: 'left', field: 'catatan' },
  { name: 'actions', label: 'Aksi', align: 'right' }
]

const filteredWilayah = computed(() => {
  const keyword = search.value.toLowerCase().trim()
  return wilayahStore.listWilayah.filter(w => {
    return !keyword ||
      w.nama.toLowerCase().includes(keyword) ||
      w.kode.toLowerCase().includes(keyword) ||
      (w.penanggungJawab && w.penanggungJawab.toLowerCase().includes(keyword))
  })
})

const openAddDialog = () => {
  editingWilayah.value = null
  form.value = {
    nama: '',
    kode: '',
    penanggungJawab: '',
    catatan: ''
  }
  dialogOpen.value = true
}

const openEditDialog = (row) => {
  editingWilayah.value = row
  form.value = {
    nama: row.nama,
    kode: row.kode,
    penanggungJawab: row.penanggungJawab || '',
    catatan: row.catatan || ''
  }
  dialogOpen.value = true
}

const saveWilayah = async () => {
  const isValid = await wilForm.value?.validate()
  if (!isValid) return

  saving.value = true
  try {
    if (editingWilayah.value) {
      await wilayahStore.updateWilayah(editingWilayah.value.id, form.value)
      $q.notify({ type: 'positive', message: 'Wilayah berhasil diperbarui!' })
    } else {
      await wilayahStore.createWilayah(form.value)
      $q.notify({ type: 'positive', message: 'Wilayah baru berhasil ditambahkan!' })
    }
    dialogOpen.value = false
  } catch (error) {
    $q.notify({ type: 'negative', message: `Gagal menyimpan wilayah: ${error.message || error}` })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (row) => {
  $q.dialog({
    title: 'Konfirmasi Hapus',
    message: `Apakah Anda yakin ingin menghapus wilayah "${row.nama}"?`,
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Hapus', color: 'negative', unelevated: true },
    persistent: true
  }).onOk(async () => {
    try {
      await wilayahStore.deleteWilayah(row.id)
      $q.notify({ type: 'positive', message: 'Wilayah berhasil dihapus.' })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.message || 'Gagal menghapus wilayah.',
        position: 'top'
      })
    }
  })
}

onMounted(() => {
  wilayahStore.loadWilayah()
})
</script>

<style lang="scss" scoped>
.page-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 16px;
}
</style>
