<template>
  <q-dialog v-model="dialogModel" persistent maximized>
    <div class="row justify-center q-pa-md">
      <q-card class="col-12 col-lg-10 col-xl-8 rounded-borders">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-bold">Tambah Data Jemaat</div>
          <div class="text-caption text-grey-6">Lengkapi data dasar sebelum menyimpan</div>
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
                :rules="[requiredRule]"
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
                :rules="[requiredRule]"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.email" label="Email" outlined type="email" />
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
            label="Simpan Data"
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
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

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

const areaOptions = [
  { label: 'Wilayah Paal 2', value: 'Paal 2' },
  { label: 'Wilayah Malalayang', value: 'Malalayang' },
  { label: 'Wilayah Tikala', value: 'Tikala' },
  { label: 'Wilayah Tuminting', value: 'Tuminting' }
]

const requiredRule = (val) => !!val || 'Wajib diisi'

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

  submitting.value = true
  try {
    const { insertJemaat } = await import('src/services/sqliteService')
    const created = await insertJemaat({
      name: form.value.fullName,
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
    })

    emit('saved', created)
    dialogModel.value = false
    resetForm()
  } finally {
    submitting.value = false
  }
}
</script>
