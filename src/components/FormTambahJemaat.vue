<template>
  <q-dialog v-model="dialogModel" persistent maximized>
    <div class="row justify-center q-pa-md">
      <q-card class="col-12 col-lg-10 col-xl-8 rounded-borders">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bold">{{ member ? 'Edit Data Jemaat' : 'Tambah Data Jemaat' }}</div>
            <div class="text-caption text-grey-6">
              {{ member ? 'Perbarui data jemaat yang dipilih' : 'Lengkapi data dasar sebelum menyimpan' }}
            </div>
          </div>
          <q-btn flat round icon="close" @click="dialogModel = false" />
        </q-card-section>
        <q-separator />

        <q-card-section>
          <q-form ref="formRef" class="q-gutter-md q-pa-md" @submit.prevent="onSubmit">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.fullName"
                  label="Nama Lengkap"
                  outlined
                  :rules="[requiredRule]"
                />
              </div>
              <div class="col-12 col-md-3">
                <q-select
                  v-model="form.gender"
                  :options="genderOptions"
                  label="Jenis Kelamin"
                  outlined
                  emit-value
                  map-options
                  :rules="[requiredRule]"
                />
              </div>
              <div class="col-12 col-md-3">
                <q-input v-model="form.birthPlace" label="Tempat Lahir" outlined />
              </div>
              <div class="col-12 col-md-3">
                <q-input
                  v-model="form.birthDate"
                  label="Tanggal Lahir"
                  outlined
                  mask="####-##-##"
                  placeholder="YYYY-MM-DD"
                  :rules="[requiredRule, dateRule]"
                >
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="form.birthDate" mask="YYYY-MM-DD" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-3">
                <q-input
                  v-model="form.phone"
                  label="No. HP"
                  outlined
                  mask="#############"
                  :rules="[requiredRule, phoneRule]"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.email"
                  label="Email"
                  outlined
                  type="email"
                  :rules="[emailRule]"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="form.area"
                  :options="areaOptions"
                  label="Wilayah"
                  outlined
                  emit-value
                  map-options
                  :rules="[requiredRule]"
                  :loading="wilayahStore.loading"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-model="form.family" label="Nama Keluarga" outlined />
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-model="form.status"
                  :options="statusOptions"
                  label="Status Jemaat"
                  outlined
                  emit-value
                  map-options
                  :rules="[requiredRule]"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-model="form.membership"
                  :options="membershipOptions"
                  label="Keanggotaan"
                  outlined
                  emit-value
                  map-options
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.baptismDate"
                  label="Tanggal Baptis (opsional)"
                  outlined
                  mask="####-##-##"
                  placeholder="YYYY-MM-DD"
                  :rules="[optDateRule]"
                >
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="form.baptismDate" mask="YYYY-MM-DD" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-12">
                <q-input
                  v-model="form.address"
                  label="Alamat Lengkap"
                  outlined
                  type="textarea"
                  autogrow
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.notes"
                  label="Catatan Pelayanan"
                  outlined
                  type="textarea"
                  autogrow
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-model="form.emergencyContact" label="Kontak Darurat" outlined />
              </div>
            </div>
          </q-form>
        </q-card-section>
        <q-separator />

        <q-card-actions align="between" class="q-pa-md">
          <div class="text-caption text-grey-6">* Data wajib diisi sesuai KTP</div>
          <div class="row q-gutter-sm">
            <q-btn outline color="primary" label="Reset" @click="resetForm" />
            <q-btn
              color="primary"
              unelevated
              :label="member ? 'Simpan Perubahan' : 'Simpan Data'"
              :loading="submitting"
              @click="onSubmit"
            />
          </div>
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useJemaatStore } from 'src/stores/jemaat'
import { useWilayahStore } from 'src/stores/wilayah'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  member: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])
const jemaatStore = useJemaatStore()
const wilayahStore = useWilayahStore()
const $q = useQuasar()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const submitting = ref(false)
const formRef = ref(null)

const form = ref({
  fullName: '',
  gender: null,
  birthPlace: '',
  birthDate: '',
  phone: '',
  email: '',
  area: null,
  family: '',
  status: null,
  membership: 'Anggota',
  baptismDate: '',
  address: '',
  notes: '',
  emergencyContact: ''
})

const genderOptions = [
  { label: 'Laki-laki', value: 'L' },
  { label: 'Perempuan', value: 'P' }
]

const statusOptions = [
  { label: 'Aktif', value: 'Aktif' },
  { label: 'Pindah', value: 'Pindah' },
  { label: 'Nonaktif', value: 'Nonaktif' }
]

const membershipOptions = [
  { label: 'Anggota', value: 'Anggota' },
  { label: 'Simpatisan', value: 'Simpatisan' },
  { label: 'Tamu', value: 'Tamu' }
]

const areaOptions = computed(() => {
  return wilayahStore.listWilayah.map((w) => ({
    label: w.nama,
    value: w.nama
  }))
})

// Rules
const requiredRule = (val) => !!val || 'Wajib diisi'
const phoneRule = (val) => !val || /^[0-9]{10,14}$/.test(val) || 'Nomor HP harus berupa 10-14 digit angka'
const emailRule = (val) => !val || /.+@.+\..+/.test(val) || 'Format email tidak valid'
const dateRule = (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val) || 'Format tanggal tidak valid (YYYY-MM-DD)'
const optDateRule = (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val) || 'Format tanggal tidak valid (YYYY-MM-DD)'

// Sync form with member prop if in Edit mode
watch(() => props.member, (newVal) => {
  if (newVal) {
    form.value = {
      fullName: newVal.fullName || newVal.name || '',
      gender: newVal.gender || null,
      birthPlace: newVal.birthPlace || '',
      birthDate: newVal.birthDate || '',
      phone: newVal.phone || '',
      email: newVal.email || '',
      area: newVal.area || null,
      family: newVal.family || '',
      status: newVal.status || null,
      membership: newVal.membership || 'Anggota',
      baptismDate: newVal.baptismDate || '',
      address: newVal.address || '',
      notes: newVal.notes || '',
      emergencyContact: newVal.emergencyContact || ''
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const resetForm = () => {
  form.value = {
    fullName: '',
    gender: null,
    birthPlace: '',
    birthDate: '',
    phone: '',
    email: '',
    area: null,
    family: '',
    status: null,
    membership: 'Anggota',
    baptismDate: '',
    address: '',
    notes: '',
    emergencyContact: ''
  }
  formRef.value?.resetValidation()
}

const onSubmit = async () => {
  const isValid = await formRef.value?.validate()
  if (!isValid) return

  // Check Duplicate Detection
  const isDuplicate = jemaatStore.listJemaat.some(m =>
    m.fullName.toLowerCase().trim() === form.value.fullName.toLowerCase().trim() &&
    m.phone.trim() === form.value.phone.trim() &&
    (!props.member || m.id !== props.member.id)
  )

  if (isDuplicate) {
    $q.notify({
      type: 'warning',
      message: 'Deteksi Duplikat: Jemaat dengan nama dan No. HP yang sama sudah terdaftar!',
      position: 'top',
      actions: [{ label: 'Tutup', color: 'white' }]
    })
    return
  }

  submitting.value = true
  try {
    const payload = {
      name: form.value.fullName,
      fullName: form.value.fullName,
      gender: form.value.gender,
      birthPlace: form.value.birthPlace,
      birthDate: form.value.birthDate,
      phone: form.value.phone,
      email: form.value.email,
      area: form.value.area,
      family: form.value.family,
      status: form.value.status,
      membership: form.value.membership,
      baptismDate: form.value.baptismDate,
      address: form.value.address,
      notes: form.value.notes,
      emergencyContact: form.value.emergencyContact
    }

    let result
    if (props.member) {
      result = await jemaatStore.updateJemaat(props.member.id, payload)
      $q.notify({
        type: 'positive',
        message: 'Data jemaat berhasil diperbarui!',
        position: 'top'
      })
    } else {
      result = await jemaatStore.createJemaat(payload)
      $q.notify({
        type: 'positive',
        message: 'Jemaat baru berhasil ditambahkan!',
        position: 'top'
      })
    }

    emit('saved', result)
    dialogModel.value = false
    resetForm()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Gagal menyimpan data: ${error.message || error}`,
      position: 'top'
    })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  wilayahStore.loadWilayah()
})
</script>
