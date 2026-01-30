<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card class="q-pa-md" style="min-width: 320px; max-width: 760px;">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-bold">Detail Keluarga</div>
          <div class="text-caption text-grey-6">{{ familyName || '-' }}</div>
        </div>
        <q-btn flat round icon="close" @click="dialogModel = false" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-list bordered separator class="rounded-borders">
          <q-item v-for="member in members" :key="member.id">
            <q-item-section avatar>
              <q-avatar size="40px">
                <img :src="member.photo" :alt="member.name" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ member.name }}</q-item-label>
              <q-item-label caption>{{ member.area }} • {{ member.phone }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-chip :color="statusColor(member.status)" text-color="white" size="sm">
                {{ member.status }}
              </q-chip>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-if="members.length === 0" class="text-caption text-grey-6 q-mt-md">
          Tidak ada anggota keluarga terdaftar.
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
  familyName: {
    type: String,
    default: ''
  },
  members: {
    type: Array,
    default: () => []
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
