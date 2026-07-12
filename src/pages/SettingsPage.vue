<template>
  <q-page class="q-pa-md page-settings">
    <!-- Header -->
    <div class="row items-center justify-between q-col-gutter-sm page-header">
      <div>
        <div class="text-h5 text-weight-bold text-grey-9">Pengaturan Sistem</div>
        <div class="text-caption text-grey-6">Ubah kata sandi, cadangkan database, ekspor-impor data, dan kelola keamanan lokal</div>
      </div>
    </div>

    <div class="row q-col-gutter-lg q-mt-md">
      <!-- Left Column: Security Settings -->
      <div class="col-12 col-md-6">
        <!-- Keamanan Kredensial -->
        <q-card flat bordered class="shadow-1 q-mb-lg" style="border-radius: 12px;">
          <q-card-section class="bg-primary text-white">
            <div class="row items-center no-wrap">
              <q-icon name="security" size="24px" class="q-mr-sm" />
              <div>
                <div class="text-subtitle1 text-weight-bold">Keamanan & PIN Kunci</div>
                <div class="text-caption text-blue-1">Ubah kata sandi admin dan PIN buka aplikasi</div>
              </div>
            </div>
          </q-card-section>
          
          <q-card-section class="q-pa-md">
            <q-form ref="securityForm" @submit.prevent="updateKeys" class="q-gutter-md">
              <q-input
                v-model="secForm.password"
                label="Password Baru"
                type="password"
                outlined
                dense
                placeholder="Masukkan password baru..."
                :rules="[val => !val || val.length >= 6 || 'Password minimal 6 karakter']"
              />
              <q-input
                v-model="secForm.pin"
                label="PIN Baru (6 Digit Angka)"
                outlined
                dense
                mask="######"
                unmasked-value
                placeholder="Masukkan 6 digit angka..."
                :rules="[val => !val || val.length === 6 || 'PIN harus berupa 6 digit angka']"
              />
              
              <div class="row justify-between items-center q-mt-md">
                <q-btn
                  outline
                  color="primary"
                  icon="lock"
                  label="Kunci Aplikasi Sekarang"
                  @click="lockNow"
                />
                <q-btn
                  color="primary"
                  unelevated
                  label="Simpan Kredensial"
                  :loading="updatingKeys"
                  @click="updateKeys"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <!-- Informasi Peran / Role Info -->
        <q-card flat bordered class="shadow-1" style="border-radius: 12px;">
          <q-card-section class="bg-grey-2 text-grey-9">
            <div class="row items-center no-wrap">
              <q-icon name="assignment_ind" size="24px" class="q-mr-sm" />
              <div>
                <div class="text-subtitle1 text-weight-bold">Profil & Peran Pengguna</div>
                <div class="text-caption text-grey-7">Status akun Anda di aplikasi ini</div>
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-md" v-if="sessionStore.currentUser">
            <div class="row q-col-gutter-sm">
              <div class="col-6 text-caption text-grey-6">Nama Lengkap:</div>
              <div class="col-6 text-body2 text-weight-medium text-grey-9">{{ sessionStore.currentUser.fullName }}</div>
              
              <div class="col-6 text-caption text-grey-6">Username:</div>
              <div class="col-6 text-body2 text-weight-medium text-grey-9 text-mono">{{ sessionStore.currentUser.username }}</div>

              <div class="col-6 text-caption text-grey-6">Peran Akses:</div>
              <div class="col-6 text-body2 text-weight-bold text-primary">{{ sessionStore.currentUser.roleName }}</div>
            </div>

            <q-banner dense class="bg-blue-1 text-blue-9 rounded-borders q-mt-md text-caption">
              <q-icon name="info" size="18px" class="q-mr-xs" />
              <strong>Viewer:</strong> Hanya baca.<br />
              <strong>Petugas:</strong> Tambah/Edit Jemaat & Presensi.<br />
              <strong>Admin:</strong> Akses penuh termasuk Backup/Restore.
            </q-banner>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right Column: Data Protection (Backup, Restore, CSV) -->
      <div class="col-12 col-md-6">
        <!-- Cadangan Database (Backup & Restore JSON) -->
        <q-card flat bordered class="shadow-1 q-mb-lg" style="border-radius: 12px;">
          <q-card-section class="bg-deep-purple text-white">
            <div class="row items-center no-wrap">
              <q-icon name="backup" size="24px" class="q-mr-sm" />
              <div>
                <div class="text-subtitle1 text-weight-bold">Cadangkan & Pulihkan (JSON)</div>
                <div class="text-caption text-deep-purple-1">Simpan cadangan database lokal atau pulihkan dari cadangan sebelumnya</div>
              </div>
            </div>
          </q-card-section>
          
          <q-card-section class="q-pa-md q-gutter-y-md">
            <div>
              <div class="text-subtitle2 text-grey-9">Cadangkan Database</div>
              <div class="text-caption text-grey-6 q-mb-sm">Ekspor seluruh data (Jemaat, Wilayah, Keluarga, Presensi, dan Pengguna) menjadi satu file cadangan .json.</div>
              <q-btn
                color="deep-purple"
                unelevated
                icon="download"
                label="Unduh Cadangan Database"
                class="full-width"
                @click="backupDb"
              />
            </div>

            <q-separator />

            <div>
              <div class="text-subtitle2 text-grey-9">Pulihkan Database</div>
              <div class="text-caption text-grey-6 q-mb-sm text-warning">
                <q-icon name="warning" class="q-mr-xs" /> Peringatan: Memulihkan database akan menimpa seluruh data saat ini secara permanen!
              </div>
              
              <div v-if="isViewer" class="text-caption text-red text-weight-bold">
                * Peran Anda (Viewer) tidak memiliki izin untuk memulihkan database.
              </div>
              <q-file
                v-else
                v-model="backupFile"
                outlined
                dense
                label="Pilih File Cadangan (.json)"
                accept=".json"
                class="full-width"
                @update:model-value="restoreDb"
              >
                <template #prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </div>
          </q-card-section>
        </q-card>

        <!-- CSV Tools -->
        <q-card flat bordered class="shadow-1" style="border-radius: 12px;">
          <q-card-section class="bg-teal text-white">
            <div class="row items-center no-wrap">
              <q-icon name="table_chart" size="24px" class="q-mr-sm" />
              <div>
                <div class="text-subtitle1 text-weight-bold">Impor / Ekspor Data Jemaat (CSV)</div>
                <div class="text-caption text-teal-1">Kelola data jemaat menggunakan file Excel/CSV</div>
              </div>
            </div>
          </q-card-section>
          
          <q-card-section class="q-pa-md q-gutter-y-md">
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-btn
                  outline
                  color="teal"
                  icon="download"
                  label="Ekspor CSV"
                  class="full-width"
                  to="/data-jemaat"
                />
              </div>
              <div class="col-6">
                <q-btn
                  color="teal"
                  unelevated
                  icon="upload"
                  label="Impor CSV"
                  class="full-width"
                  @click="importCsvDialog = true"
                />
              </div>
            </div>
            <div class="text-caption text-grey-6 text-center">
              Impor CSV mendukung pencocokan data duplikat otomatis dan validasi nomor HP/Email sebelum masuk ke database SQLite.
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Import CSV Dialog overlay -->
    <ImportCsvDialog v-model="importCsvDialog" />
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSessionStore } from 'stores/session'
import { useQuasar } from 'quasar'
import { exportDatabaseBackup, importDatabaseBackup } from 'src/services/backupService'
import ImportCsvDialog from 'components/ImportCsvDialog.vue'

const sessionStore = useSessionStore()
const $q = useQuasar()

const securityForm = ref(null)
const updatingKeys = ref(false)
const backupFile = ref(null)
const importCsvDialog = ref(false)

const secForm = ref({
  password: '',
  pin: ''
})

const isViewer = computed(() => sessionStore.currentUser?.roleCode === 'viewer')

const updateKeys = async () => {
  if (!secForm.value.password && !secForm.value.pin) {
    $q.notify({
      type: 'warning',
      message: 'Masukkan password baru atau PIN baru terlebih dahulu!'
    })
    return
  }

  const isValid = await securityForm.value?.validate()
  if (!isValid) return

  updatingKeys.value = true
  try {
    const password = secForm.value.password || 'CHANGE_ME'
    const pin = secForm.value.pin || 'CHANGE_ME'

    await sessionStore.changeCredentials(password, pin)

    $q.notify({
      type: 'positive',
      message: 'Kredensial berhasil diperbarui!'
    })
    secForm.value.password = ''
    secForm.value.pin = ''
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Gagal memperbarui kredensial: ${error.message || error}`
    })
  } finally {
    updatingKeys.value = false
  }
}

const lockNow = () => {
  sessionStore.lock()
  $q.notify({
    type: 'info',
    message: 'Aplikasi Terkunci'
  })
}

// Backup database JSON
const backupDb = async () => {
  try {
    const backup = await exportDatabaseBackup()
    const jsonStr = JSON.stringify(backup, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `db_jemaat_backup_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    $q.notify({
      type: 'positive',
      message: 'File cadangan JSON berhasil dibuat dan diunduh!',
      position: 'top'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Gagal membuat cadangan: ${error.message || error}`
    })
  }
}

// Restore database JSON
const restoreDb = (file) => {
  if (!file) return

  $q.dialog({
    title: 'Konfirmasi Pemulihan Database',
    message: 'Apakah Anda yakin ingin memulihkan database dari file cadangan ini? Tindakan ini akan menghapus dan menimpa SELURUH data saat ini!',
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Pulihkan', color: 'negative', unelevated: true },
    persistent: true
  }).onOk(() => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target.result)
        await importDatabaseBackup(backup)
        
        $q.notify({
          type: 'positive',
          message: 'Database berhasil dipulihkan dari file cadangan JSON!',
          position: 'top'
        })
        
        // Reload page to refresh all stores and layouts
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: `Gagal memulihkan database: ${error.message || error}`,
          position: 'top',
          actions: [{ label: 'Mengerti', color: 'white' }]
        })
      } finally {
        backupFile.value = null
      }
    }
    reader.readAsText(file)
  }).onCancel(() => {
    backupFile.value = null
  })
}
</script>

<style lang="scss" scoped>
.page-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 16px;
}
</style>
