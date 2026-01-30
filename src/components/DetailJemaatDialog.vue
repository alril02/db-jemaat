<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card class="q-pa-md" style="min-width: 320px; max-width: 760px;">
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
            <q-card flat bordered class="q-pa-md">
              <div class="column items-center">
                <q-avatar size="88px">
                  <img :src="member.photo" :alt="member.name" />
                </q-avatar>
                <div class="text-subtitle1 text-weight-bold q-mt-sm">{{ member.name }}</div>
                <div class="text-caption text-grey-6">{{ member.family }}</div>
                <q-chip class="q-mt-sm" :color="statusColor(member.status)" text-color="white" size="sm">
                  {{ member.status }}
                </q-chip>
                <q-chip color="primary" outline size="sm" class="q-mt-xs">
                  {{ member.membership }}
                </q-chip>
              </div>
            </q-card>
          </div>

          <div class="col-12 col-md-8">
            <q-list bordered separator class="rounded-borders">
              <q-item>
                <q-item-section>
                  <q-item-label caption>Wilayah</q-item-label>
                  <q-item-label>{{ member.area }}</q-item-label>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Jenis Kelamin</q-item-label>
                  <q-item-label>{{ member.gender }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Tempat/Tanggal Lahir</q-item-label>
                  <q-item-label>{{ member.birthPlace }}, {{ member.birthDate }}</q-item-label>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Baptisan</q-item-label>
                  <q-item-label>{{ member.baptismDate || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Telepon</q-item-label>
                  <q-item-label>{{ member.phone }}</q-item-label>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Email</q-item-label>
                  <q-item-label>{{ member.email || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Alamat</q-item-label>
                  <q-item-label>{{ member.address }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Catatan Pelayanan</q-item-label>
                  <q-item-label>{{ member.notes || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Kontak Darurat</q-item-label>
                  <q-item-label>{{ member.emergencyContact || '-' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <q-card flat bordered class="q-mt-md">
              <q-card-section>
                <div class="text-subtitle2 text-weight-bold">Kehadiran Ibadah Minggu</div>
                <div class="text-caption text-grey-6">{{ member.attendanceNote }}</div>
                <q-linear-progress
                  :value="member.attendanceRate / 100"
                  color="primary"
                  track-color="grey-3"
                  rounded
                  class="q-mt-sm"
                />
                <div class="text-caption text-grey-6 q-mt-xs">{{ member.attendanceRate }}%</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

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

const emit = defineEmits(['update:modelValue'])

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const statusColor = (status) => {
  if (status === 'Aktif') return 'positive'
  if (status === 'Pindah') return 'warning'
  return 'negative'
}
</script>
