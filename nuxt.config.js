// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  devtools: {
    enabled: true, // or false to disable
  },
  pages: true,

  modules: [
    "@nuxt/icon",
    "nuxt-lodash",
    "@nuxtjs/tailwindcss",
    "@nuxtjs/supabase",
    "@unlok-co/nuxt-stripe",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate",
  ],
  // runtimeConfig: {
  //   public: {
  //     stripe:{key: process.env.STRIPE_PUBLIC_KEY},
  //     supabaseUrl: process.env.SUPABASE_URL,
  //     supabaseKey: process.env.SUPABASE_KEY,
  //   }
  // },
  runtimeConfig: {
    public: {
      stripe: { key: process.env.STRIPE_PUBLIC_KEY },
    },
    stripe: {
      key: process.env.STRIPE_SECRET_KEY,
      options: {},
    },
  },
  supabase: {
    redirectOptions: {
      include: ["/checkout"],
      login: "/login",
      callback: "/confirm",
      saveRedirectToCookie: true,
    },
  },
  // app: {
  //   head: {
  //     script: [
  //       {
  //         src: "https://js.stripe.com/v3/",
  //         async: true,
  //       },
  //     ],
  //   },
  // },
  app: {
    head: {
      script: [{ src: "https://js.stripe.com/v3/", defer: true }],
    },
  },

  compatibilityDate: "2024-11-01",
});
