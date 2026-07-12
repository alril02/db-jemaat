<template>
  <q-dialog v-model="jemaatStore.kartuJemaatDialog" persistent>
    <q-card class="q-pa-lg" style="min-width: 320px; max-width: 720px;">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6 text-weight-bold">Kartu Jemaat</div>
          <div class="text-caption text-grey-6">Pratinjau kartu jemaat</div>
        </div>
        <q-btn flat round icon="close" @click="jemaatStore.closeKartuJemaatDialog()" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-card flat bordered class="rounded-borders">
          <div class="q-pa-md">
            <div class="row items-center justify-between">
              <div class="row items-center">
                <img :src="logo" alt="Ecclesia" style="height: 36px;" />
                <div class="q-ml-sm">
                  <div class="text-subtitle2 text-weight-bold">Ecclesia Family Church</div>
                  <div class="text-caption text-grey-6">Kartu Jemaat</div>
                </div>
              </div>
              <q-chip :color="statusColor(displayMember.status)" text-color="white" size="sm">
                {{ displayMember.status || '-' }}
              </q-chip>
            </div>
          </div>

          <q-separator />

          <div class="row q-col-gutter-md q-pa-md">
            <div class="col-12 col-md-4">
              <div class="column items-center">
                <q-avatar size="96px" class="bg-grey-3">
                  <img :src="displayMember.photo" :alt="displayMember.fullName" />
                </q-avatar>
                <div class="text-subtitle1 text-weight-bold q-mt-sm">
                  {{ displayMember.fullName }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ displayMember.family || '-' }}
                </div>
                <div class="text-caption text-grey-6 q-mt-sm">Nomor Kartu</div>
                <div class="text-subtitle2 text-weight-medium">
                  {{ displayMember.cardNumber }}
                </div>
              </div>
            </div>

            <div class="col-12 col-md-8">
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="text-caption text-grey-6">Jenis Kelamin</div>
                  <div class="text-body2 text-weight-medium">
                    {{ genderLabel(displayMember.gender) }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">Tempat/Tgl Lahir</div>
                  <div class="text-body2 text-weight-medium">
                    {{ displayMember.birthPlace }}, {{ displayMember.birthDate }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">Wilayah</div>
                  <div class="text-body2 text-weight-medium">
                    {{ displayMember.area }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">Keanggotaan</div>
                  <div class="text-body2 text-weight-medium">
                    {{ displayMember.membership }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">No. HP</div>
                  <div class="text-body2 text-weight-medium">
                    {{ displayMember.phone }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">Email</div>
                  <div class="text-body2 text-weight-medium">
                    {{ displayMember.email || '-' }}
                  </div>
                </div>
                <div class="col-12">
                  <div class="text-caption text-grey-6">Alamat</div>
                  <div class="text-body2 text-weight-medium">
                    {{ displayMember.address }}
                  </div>
                </div>
                <div class="col-12">
                  <div class="text-caption text-grey-6">Kontak Darurat</div>
                  <div class="text-body2 text-weight-medium">
                    {{ displayMember.emergencyContact || '-' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card>
      </q-card-section>

      <q-separator />

      <q-card-actions align="between" class="q-pa-md">
        <div class="text-caption text-grey-6">* Data ditampilkan sesuai Form Tambah Jemaat</div>
        <q-btn color="primary" unelevated icon="print" label="Cetak" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useJemaatStore } from 'stores/jemaat'
import logo from 'assets/images.png'

const jemaatStore = useJemaatStore()
const displayMember = computed(() => jemaatStore.cardMember)

const genderLabel = (gender) => (gender === 'L' ? 'Laki-laki' : gender === 'P' ? 'Perempuan' : '-')

const statusColor = (status) => {
  if (status === 'Aktif') return 'positive'
  if (status === 'Pindah') return 'warning'
  if (status === 'Nonaktif') return 'negative'
  return 'grey'
}
</script>
