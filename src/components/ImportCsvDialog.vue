<template>
  <q-dialog v-model="dialogModel" persistent maximized>
    <div class="row justify-center q-pa-md">
      <q-card class="col-12 col-lg-10 col-xl-8 rounded-borders shadow-2 column justify-between">
        <!-- Header -->
        <q-card-section class="row items-center justify-between bg-primary text-white">
          <div>
            <div class="text-h6 text-weight-bold">Impor Data Jemaat dari CSV</div>
            <div class="text-caption text-blue-1">Pilih file CSV untuk divalidasi dan dimasukkan ke database lokal</div>
          </div>
          <q-btn flat round icon="close" color="white" @click="closeDialog" />
        </q-card-section>
        
        <q-separator />

        <!-- Main Body -->
        <q-card-section class="col-grow q-pa-md scroll">
          <!-- Step 1: Upload File -->
          <div v-if="parsedData.length === 0" class="flex flex-center column q-py-xl">
            <q-icon name="cloud_upload" size="72px" color="grey-5" />
            <div class="text-subtitle1 text-weight-medium text-grey-8 q-mt-md">Unggah File CSV Hasil Ekspor</div>
            <div class="text-caption text-grey-6 q-mb-lg text-center" style="max-width: 400px;">
              Pastikan format kolom sesuai dengan template ekspor (Nama Lengkap, No HP, Wilayah, Keluarga, dll).
            </div>
            
            <q-file
              v-model="csvFile"
              outlined
              label="Pilih File .csv"
              accept=".csv"
              style="max-width: 300px; width: 100%;"
              @update:model-value="handleFileUploaded"
            >
              <template #prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
          </div>

          <!-- Step 2: Preview & Validation Table -->
          <div v-else>
            <div class="row items-center justify-between q-mb-md">
              <div class="text-subtitle1 text-weight-bold">Preview Data ({{ parsedData.length }} Baris)</div>
              <div class="row q-gutter-sm">
                <q-chip color="positive" text-color="white" icon="check_circle" size="sm">
                  {{ stats.valid }} Valid
                </q-chip>
                <q-chip color="warning" text-color="white" icon="warning" size="sm">
                  {{ stats.duplicate }} Duplikat
                </q-chip>
                <q-chip color="negative" text-color="white" icon="error" size="sm">
                  {{ stats.invalid }} Error
                </q-chip>
              </div>
            </div>

            <q-table
              :rows="parsedData"
              :columns="columns"
              row-key="rowNum"
              flat
              bordered
              dense
              :rows-per-page-options="[10, 25, 50]"
            >
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-chip
                    v-if="props.value === 'valid'"
                    color="positive"
                    text-color="white"
                    size="xs"
                    dense
                  >
                    Valid
                  </q-chip>
                  <q-chip
                    v-else-if="props.value === 'duplicate'"
                    color="warning"
                    text-color="white"
                    size="xs"
                    dense
                  >
                    Duplikat
                  </q-chip>
                  <q-chip
                    v-else
                    color="negative"
                    text-color="white"
                    size="xs"
                    dense
                  >
                    {{ props.row.validationError }}
                  </q-chip>
                </q-td>
              </template>
            </q-table>
          </div>
        </q-card-section>

        <!-- Footer Actions -->
        <q-separator />
        <q-card-actions align="between" class="q-pa-md bg-grey-1">
          <q-btn
            v-if="parsedData.length > 0"
            flat
            color="primary"
            icon="arrow_back"
            label="Upload Ulang"
            @click="resetImport"
          />
          <div v-else class="text-caption text-grey-6">Mendukung file berformat UTF-8 saja.</div>

          <div class="row q-gutter-sm">
            <q-btn flat label="Batal" color="primary" @click="closeDialog" />
            <q-btn
              v-if="parsedData.length > 0"
              color="primary"
              unelevated
              icon="save_alt"
              :label="`Impor ${stats.valid} Data Valid`"
              :disable="stats.valid === 0"
              :loading="importing"
              @click="executeImport"
            />
          </div>
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useJemaatStore } from 'src/stores/jemaat'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'imported'])
const jemaatStore = useJemaatStore()
const $q = useQuasar()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const csvFile = ref(null)
const parsedData = ref([])
const importing = ref(false)

const stats = computed(() => {
  let valid = 0
  let duplicate = 0
  let invalid = 0
  
  parsedData.value.forEach(row => {
    if (row.importStatus === 'valid') valid++
    else if (row.importStatus === 'duplicate') duplicate++
    else invalid++
  })

  return { valid, duplicate, invalid }
})

const columns = [
  { name: 'rowNum', label: '#', align: 'left', field: 'rowNum', style: 'width: 50px' },
  { name: 'name', label: 'Nama', align: 'left', field: 'name', sortable: true },
  { name: 'phone', label: 'No HP', align: 'left', field: 'phone' },
  { name: 'area', label: 'Wilayah', align: 'left', field: 'area' },
  { name: 'family', label: 'Keluarga', align: 'left', field: 'family' },
  { name: 'status', label: 'Status', align: 'left', field: 'status' },
  { name: 'status', label: 'Status Impor', align: 'left', field: 'importStatus' }
]

const closeDialog = () => {
  resetImport()
  dialogModel.value = false
}

const resetImport = () => {
  csvFile.value = null
  parsedData.value = []
  importing.value = false
}

const handleFileUploaded = (file) => {
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target.result
    processCSV(text)
  }
  reader.readAsText(file)
}

const processCSV = (text) => {
  try {
    const lines = text.split(/\r?\n/)
    if (lines.length < 2) {
      $q.notify({ type: 'negative', message: 'File CSV kosong atau tidak valid!' })
      return
    }

    // Extract headers (remove double quotes and trim)
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
    
    // We expect certain headers (case-insensitive checks)
    const headerMap = {
      name: headers.indexOf('nama lengkap') !== -1 ? headers.indexOf('nama lengkap') : headers.indexOf('nama'),
      gender: headers.indexOf('jenis kelamin'),
      birthplace: headers.indexOf('tempat lahir'),
      birthdate: headers.indexOf('tanggal lahir'),
      phone: headers.indexOf('no hp') !== -1 ? headers.indexOf('no hp') : headers.indexOf('telepon'),
      email: headers.indexOf('email'),
      address: headers.indexOf('alamat'),
      area: headers.indexOf('wilayah'),
      family: headers.indexOf('keluarga'),
      status: headers.indexOf('status jemaat') !== -1 ? headers.indexOf('status jemaat') : headers.indexOf('status'),
      membership: headers.indexOf('keanggotaan'),
      baptismdate: headers.indexOf('tanggal baptis'),
      emergencycontact: headers.indexOf('kontak darurat'),
      notes: headers.indexOf('catatan')
    }

    if (headerMap.name === -1 || headerMap.phone === -1 || headerMap.area === -1) {
      $q.notify({
        type: 'negative',
        message: 'Header CSV tidak valid! Wajib memiliki kolom: Nama Lengkap/Nama, No HP, dan Wilayah.',
        actions: [{ label: 'Mengerti', color: 'white' }]
      })
      return
    }

    const tempRows = []
    let rowNum = 1

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Regex parser to handle comma separation with fields in double quotes correctly
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
      const values = matches.map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"').trim())

      if (values.length === 0) continue

      const row = {
        rowNum: rowNum++,
        name: headerMap.name !== -1 ? values[headerMap.name] : '',
        gender: headerMap.gender !== -1 ? values[headerMap.gender] : '',
        birthPlace: headerMap.birthplace !== -1 ? values[headerMap.birthplace] : '',
        birthDate: headerMap.birthdate !== -1 ? values[headerMap.birthdate] : '',
        phone: headerMap.phone !== -1 ? values[headerMap.phone] : '',
        email: headerMap.email !== -1 ? values[headerMap.email] : '',
        address: headerMap.address !== -1 ? values[headerMap.address] : '',
        area: headerMap.area !== -1 ? values[headerMap.area] : '',
        family: headerMap.family !== -1 ? values[headerMap.family] : '',
        status: headerMap.status !== -1 ? values[headerMap.status] : 'Aktif',
        membership: headerMap.membership !== -1 ? values[headerMap.membership] : 'Anggota',
        baptismDate: headerMap.baptismdate !== -1 ? values[headerMap.baptismdate] : '',
        emergencyContact: headerMap.emergencycontact !== -1 ? values[headerMap.emergencycontact] : '',
        notes: headerMap.notes !== -1 ? values[headerMap.notes] : '',
        importStatus: 'valid',
        validationError: ''
      }

      // Validations
      if (!row.name) {
        row.importStatus = 'invalid'
        row.validationError = 'Nama Kosong'
      } else if (!row.phone) {
        row.importStatus = 'invalid'
        row.validationError = 'No HP Kosong'
      } else if (!/^[0-9]{10,14}$/.test(row.phone)) {
        row.importStatus = 'invalid'
        row.validationError = 'Format No HP'
      } else if (!row.area) {
        row.importStatus = 'invalid'
        row.validationError = 'Wilayah Kosong'
      } else if (row.email && !/.+@.+\..+/.test(row.email)) {
        row.importStatus = 'invalid'
        row.validationError = 'Format Email'
      } else if (row.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(row.birthDate)) {
        row.importStatus = 'invalid'
        row.validationError = 'Format Tgl Lahir'
      } else {
        // Check duplicate in database store
        const isDuplicate = jemaatStore.listJemaat.some(m =>
          m.fullName.toLowerCase().trim() === row.name.toLowerCase().trim() &&
          m.phone.trim() === row.phone.trim()
        )
        if (isDuplicate) {
          row.importStatus = 'duplicate'
        }
      }

      tempRows.push(row)
    }

    parsedData.value = tempRows
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Gagal memproses file CSV!' })
  }
}

const executeImport = async () => {
  const validRows = parsedData.value.filter(row => row.importStatus === 'valid')
  if (validRows.length === 0) return

  importing.value = true
  let successCount = 0
  let failCount = 0

  try {
    for (const row of validRows) {
      try {
        await jemaatStore.createJemaat({
          name: row.name,
          fullName: row.name,
          gender: row.gender || 'L',
          birthPlace: row.birthPlace,
          birthDate: row.birthDate,
          phone: row.phone,
          email: row.email,
          area: row.area,
          family: row.family,
          status: row.status,
          membership: row.membership,
          baptismDate: row.baptismDate,
          address: row.address,
          notes: row.notes,
          emergencyContact: row.emergencyContact
        })
        successCount++
      } catch (err) {
        console.error(err)
        failCount++
      }
    }

    $q.notify({
      type: successCount > 0 ? 'positive' : 'negative',
      message: `Impor Selesai: ${successCount} berhasil dimasukkan, ${failCount} gagal.`,
      position: 'top'
    })

    emit('imported')
    closeDialog()
  } finally {
    importing.value = false
  }
}
</script>
