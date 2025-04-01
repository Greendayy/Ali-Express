
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  pages: true,

  modules: [
    '@nuxt/icon',
    'nuxt-lodash',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
  ],
  supabase: { redirect: false },
  runtimeConfig: {
    public: {
      stripePK: process.env.STRIPE_PK_KEY,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    }
  },

  app: {
    head: {
      script: [
        { src: 'https://js.stripe.com/v3/',defer: true },
      ],
      // meta: [
      //   {
      //     'http-equiv': 'Content-Security-Policy',
      //     content: `
      //       worker-src 'self' blob:;
      //       connect-src 'self' https://api.stripe.com;
      //     `,
      //   },
      // ],
    }
  },

  compatibilityDate: '2025-03-12'
})


