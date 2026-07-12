const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'data-jemaat', component: () => import('pages/DataJemaatPage.vue') },
      { path: 'wilayah', component: () => import('pages/WilayahPage.vue') },
      { path: 'keluarga', component: () => import('pages/KeluargaPage.vue') },
      { path: 'settings', component: () => import('pages/SettingsPage.vue') },
      { path: 'events', component: () => import('pages/EventIbadahPage.vue') },
      { path: 'events/:id/presensi', component: () => import('pages/PresensiSesiPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
