<template>
  <div>
    <!-- 1. Database Loading Screen -->
    <div v-if="dbStore.loading" class="flex flex-center fullscreen bg-grey-1 column">
      <q-spinner-oval color="primary" size="80px" />
      <div class="text-h6 text-weight-bold text-primary q-mt-md">Menginisialisasi Database Lokal...</div>
      <div class="text-caption text-grey-6 q-mt-xs">Menyiapkan SQLite untuk penyimpanan offline</div>
    </div>

    <!-- 2. Database Error Screen -->
    <div v-else-if="dbStore.error" class="flex flex-center fullscreen bg-red-1 column q-pa-lg text-center">
      <q-icon name="error_outline" color="negative" size="80px" />
      <div class="text-h5 text-weight-bold text-negative q-mt-md">Database Error</div>
      <div class="text-body1 text-grey-8 q-mt-sm" style="max-width: 500px;">
        Gagal menginisialisasi penyimpanan lokal SQLite.
      </div>
      <q-card flat bordered class="q-ma-md bg-white text-left text-mono q-pa-sm text-caption" style="max-width: 600px; width: 100%;">
        {{ dbStore.error }}
      </q-card>
      <q-btn color="negative" unelevated label="Coba Lagi" icon="refresh" class="q-mt-md" @click="retryInit" />
    </div>

    <!-- 3. Setup Credentials Screen (If mustChangeCredential is true) -->
    <div v-else-if="sessionStore.currentUser && sessionStore.currentUser.mustChangeCredential" class="flex flex-center fullscreen bg-blue-grey-1 q-pa-md">
      <q-card class="setup-card q-pa-lg" style="width: 100%; max-width: 450px; border-radius: 12px;">
        <q-card-section class="text-center">
          <q-avatar size="60px" color="primary" text-color="white" icon="security" />
          <div class="text-h5 text-weight-bold q-mt-md text-primary">Inisialisasi Keamanan</div>
          <div class="text-caption text-grey-6 q-mt-xs">Sandi dan PIN default terdeteksi. Silakan ganti demi keamanan data jemaat.</div>
        </q-card-section>

        <q-card-section>
          <q-form ref="setupForm" @submit.prevent="handleSetup">
            <q-input
              v-model="sessionStore.currentUser.username"
              label="Username"
              outlined
              dense
              disable
              class="q-mb-md"
            />
            <q-input
              v-model="setupData.password"
              label="Password Baru"
              type="password"
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || 'Wajib diisi', val => val.length >= 6 || 'Minimal 6 karakter']"
            />
            <q-input
              v-model="setupData.pin"
              label="PIN Baru (6 Digit Angka)"
              mask="######"
              unmasked-value
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || 'Wajib diisi', val => val.length === 6 || 'PIN harus 6 digit angka']"
            />
            <q-input
              v-model="setupData.confirmPin"
              label="Konfirmasi PIN Baru"
              mask="######"
              unmasked-value
              outlined
              dense
              class="q-mb-md"
              :rules="[val => !!val || 'Wajib diisi', val => val === setupData.pin || 'Konfirmasi PIN tidak cocok']"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              class="full-width q-mt-md"
              label="Simpan dan Buka Aplikasi"
              :loading="submitting"
            />
          </q-form>
        </q-card-section>
      </q-card>
    </div>

    <!-- 4. Lock Screen Overlay (Keypad PIN) -->
    <div v-else-if="sessionStore.isLocked" class="flex flex-center fullscreen lock-screen bg-primary column text-white">
      <div class="column items-center justify-center full-width text-center" style="max-width: 350px;">
        <q-avatar size="64px" color="white" text-color="primary" icon="lock" class="shadow-3" />
        <div class="text-h5 text-weight-bold q-mt-md">Aplikasi Terkunci</div>
        <div class="text-caption text-blue-1 q-mt-xs">Masukkan PIN Keamanan untuk membuka</div>

        <!-- PIN Dots Indicator -->
        <div class="row q-gutter-md q-my-lg justify-center">
          <div
            v-for="i in 6"
            :key="i"
            class="pin-dot"
            :class="{ 'pin-dot-active bg-white': enteredPin.length >= i, 'border-white': enteredPin.length < i }"
          ></div>
        </div>

        <!-- PIN Keypad Grid -->
        <div class="keypad-grid full-width q-px-md">
          <div class="row q-col-gutter-sm">
            <div v-for="num in [1,2,3,4,5,6,7,8,9]" :key="num" class="col-4">
              <q-btn flat class="keypad-btn full-width" :label="String(num)" @click="pressKey(num)" />
            </div>
            <div class="col-4">
              <q-btn flat class="keypad-btn full-width text-caption" label="Hapus" @click="pressBackspace" />
            </div>
            <div class="col-4">
              <q-btn flat class="keypad-btn full-width" label="0" @click="pressKey(0)" />
            </div>
            <div class="col-4">
              <q-btn flat class="keypad-btn full-width text-caption" label="Reset" @click="clearPin" />
            </div>
          </div>
        </div>

        <div v-if="pinError" class="text-negative text-caption text-weight-bold q-mt-md bg-red-1 text-red q-px-md q-py-xs rounded-borders">
          {{ pinError }}
        </div>
      </div>
    </div>

    <!-- 5. Main Application -->
    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useDbStore } from 'stores/db'
import { useSessionStore } from 'stores/session'
import { useQuasar } from 'quasar'

const dbStore = useDbStore()
const sessionStore = useSessionStore()
const $q = useQuasar()

// Credentials Setup State
const setupForm = ref(null)
const submitting = ref(false)
const setupData = ref({
  password: '',
  pin: '',
  confirmPin: ''
})

// PIN Keypad State
const enteredPin = ref('')
const pinError = ref('')

// Inactivity Timer State
let inactivityTimeout = null

const retryInit = () => {
  window.location.reload()
}

const handleSetup = async () => {
  const isValid = await setupForm.value?.validate()
  if (!isValid) return

  submitting.value = true
  try {
    const success = await sessionStore.changeCredentials(setupData.value.password, setupData.value.pin)
    if (success) {
      $q.notify({
        type: 'positive',
        message: 'Kredensial berhasil disetup. Selamat menggunakan aplikasi!',
        position: 'top'
      })
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Setup gagal: ${error.message || error}`,
      position: 'top'
    })
  } finally {
    submitting.value = false
  }
}

// Keypad Input Handler
const pressKey = (num) => {
  if (enteredPin.value.length < 6) {
    enteredPin.value += String(num)
    pinError.value = ''
  }
}

const pressBackspace = () => {
  enteredPin.value = enteredPin.value.slice(0, -1)
}

const clearPin = () => {
  enteredPin.value = ''
  pinError.value = ''
}

// Watch entered PIN length to auto-submit when 6 digits are typed
watch(enteredPin, async (newVal) => {
  if (newVal.length === 6) {
    const success = await sessionStore.unlock(newVal)
    if (success) {
      $q.notify({
        type: 'positive',
        message: 'Aplikasi Terbuka',
        position: 'top',
        timeout: 1000
      })
      clearPin()
      resetInactivityTimer()
    } else {
      pinError.value = 'PIN Salah! Silakan coba lagi.'
      enteredPin.value = '' // Clear
      // Subtle haptic vibration if available
      if (navigator.vibrate) navigator.vibrate(200)
    }
  }
})

// Inactivity Auto-Lock Handler
const resetInactivityTimer = () => {
  if (inactivityTimeout) clearTimeout(inactivityTimeout)

  // Only lock if authenticated and PIN is already set up and not already locked
  if (!sessionStore.currentUser || sessionStore.currentUser.mustChangeCredential || sessionStore.locked) return

  inactivityTimeout = setTimeout(() => {
    sessionStore.lock()
    $q.notify({
      message: 'Aplikasi dikunci karena tidak aktif',
      color: 'grey-8',
      icon: 'lock',
      position: 'bottom-left',
      timeout: 2000
    })
  }, 5 * 60 * 1000) // 5 minutes
}

onMounted(() => {
  // Listen for user actions globally to reset lock timer
  window.addEventListener('mousemove', resetInactivityTimer)
  window.addEventListener('mousedown', resetInactivityTimer)
  window.addEventListener('keypress', resetInactivityTimer)
  window.addEventListener('touchstart', resetInactivityTimer)
  window.addEventListener('scroll', resetInactivityTimer)

  // Listen to store updates
  watch(() => sessionStore.currentUser, () => {
    resetInactivityTimer()
  })

  watch(() => sessionStore.locked, (isLocked) => {
    if (!isLocked) {
      resetInactivityTimer()
    } else {
      if (inactivityTimeout) clearTimeout(inactivityTimeout)
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('mousemove', resetInactivityTimer)
  window.removeEventListener('mousedown', resetInactivityTimer)
  window.removeEventListener('keypress', resetInactivityTimer)
  window.removeEventListener('touchstart', resetInactivityTimer)
  window.removeEventListener('scroll', resetInactivityTimer)
  if (inactivityTimeout) clearTimeout(inactivityTimeout)
})
</script>

<style lang="scss">
.setup-card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.lock-screen {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  user-select: none;
}

.pin-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
}

.pin-dot-active {
  transform: scale(1.2);
}

.keypad-grid {
  margin-top: 10px;
}

.keypad-btn {
  font-size: 1.5rem !important;
  font-weight: 500;
  height: 64px;
  border-radius: 50% !important;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  transition: all 0.15s ease;

  &:active {
    background-color: rgba(255, 255, 255, 0.25);
  }
}
</style>
