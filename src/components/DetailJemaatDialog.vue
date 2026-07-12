<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card class="q-pa-sm" style="min-width: 320px; width: 100%; max-width: 760px; border-radius: 12px;">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-bold">Detail Jemaat</div>
          <div class="text-caption text-grey-6">Informasi lengkap jemaat</div>
        </div>
        <q-btn flat round icon="close" @click="dialogModel = false" />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="member">
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-4">
            <q-card flat bordered class="q-pa-md bg-grey-1 text-center" style="border-radius: 8px;">
              <div class="column items-center">
                <q-avatar size="100px" class="q-mb-md shadow-1">
                  <img :src="member.photo" :alt="member.name" />
                </q-avatar>
                <div class="text-subtitle1 text-weight-bold text-grey-9">{{ member.name }}</div>
                <div class="text-caption text-grey-6 q-mt-xs">{{ member.family || 'Belum ada keluarga' }}</div>
                
                <q-chip class="q-mt-md text-weight-medium" :color="statusColor(member.status)" text-color="white" size="sm">
                  {{ member.status }}
                </q-chip>
                <q-chip color="primary" outline size="sm" class="q-mt-xs">
                  {{ member.membership }}
                </q-chip>
              </div>
            </q-card>
          </div>

          <div class="col-12 col-md-8">
            <q-list bordered separator class="rounded-borders" style="border-radius: 8px;">
              <q-item>
                <q-item-section>
                  <q-item-label caption class="text-grey-6">Wilayah</q-item-label>
                  <q-item-label class="text-weight-medium text-grey-9">{{ member.area }}</q-item-label>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-grey-6">Jenis Kelamin</q-item-label>
                  <q-item-label class="text-weight-medium text-grey-9">
                    {{ member.gender === 'L' ? 'Laki-laki' : member.gender === 'P' ? 'Perempuan' : member.gender }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption class="text-grey-6">Tempat/Tanggal Lahir</q-item-label>
                  <q-item-label class="text-weight-medium text-grey-9">{{ member.birthPlace || '-' }}, {{ member.birthDate }}</q-item-label>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-grey-6">Tanggal Baptisan</q-item-label>
                  <q-item-label class="text-weight-medium text-grey-9">{{ member.baptismDate || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption class="text-grey-6">Telepon</q-item-label>
                  <q-item-label class="text-weight-medium text-grey-9">{{ member.phone }}</q-item-label>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-grey-6">Email</q-item-label>
                  <q-item-label class="text-weight-medium text-grey-9 text-lowercase">{{ member.email || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption class="text-grey-6">Alamat</q-item-label>
                  <q-item-label class="text-weight-medium text-grey-9">{{ member.address || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption class="text-grey-6">Catatan Pelayanan</q-item-label>
                  <q-item-label class="text-weight-medium text-grey-9">{{ member.notes || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption class="text-grey-6">Kontak Darurat</q-item-label>
                  <q-item-label class="text-weight-medium text-grey-9">{{ member.emergencyContact || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <q-card flat bordered class="q-mt-md" style="border-radius: 8px;">
              <q-card-section>
                <div class="text-subtitle2 text-weight-bold text-grey-8">Kehadiran Ibadah Minggu</div>
                <div class="text-caption text-grey-6 q-mt-xs">{{ member.attendanceNote }}</div>
                <q-linear-progress
                  :value="member.attendanceRate / 100"
                  color="primary"
                  track-color="grey-3"
                  rounded
                  class="q-mt-sm"
                />
                <div class="text-caption text-grey-6 q-mt-xs">{{ member.attendanceRate }}% kehadiran</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-separator v-if="!isViewer" />

      <!-- Action buttons for editing/deleting -->
      <q-card-actions v-if="!isViewer && member" align="right" class="q-pa-md q-gutter-sm">
        <q-btn
          outline
          color="negative"
          icon="delete"
          label="Hapus"
          @click="confirmDelete"
        />
        <q-btn
          unelevated
          color="primary"
          icon="edit"
          label="Edit Data"
          @click="onEdit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useJemaatStore } from 'src/stores/jemaat'
import { useSessionStore } from 'src/stores/session'
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

const emit = defineEmits(['update:modelValue', 'edit'])
const jemaatStore = useJemaatStore()
const sessionStore = useSessionStore()
const $q = useQuasar()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isViewer = computed(() => sessionStore.currentUser?.roleCode === 'viewer')

const statusColor = (status) => {
  if (status === 'Aktif') return 'positive'
  if (status === 'Pindah') return 'warning'
  return 'negative'
}

const onEdit = () => {
  dialogModel.value = false
  emit('edit', props.member)
}

const confirmDelete = () => {
  $q.dialog({
    title: 'Konfirmasi Hapus',
    message: `Apakah Anda yakin ingin menghapus data jemaat "${props.member.name}" secara permanen dari daftar aktif?`,
    cancel: {
      label: 'Batal',
      flat: true
    },
    ok: {
      label: 'Hapus',
      color: 'negative',
      unelevated: true
    },
    persistent: true
  }).onOk(async () => {
    try {
      await jemaatStore.softDeleteJemaat(props.member.id)
      $q.notify({
        type: 'positive',
        message: `Data jemaat ${props.member.name} berhasil dihapus.`,
        position: 'top'
      })
      dialogModel.value = false
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: `Gagal menghapus jemaat: ${error.message || error}`,
        position: 'top'
      })
    }
  })
}
</script>
