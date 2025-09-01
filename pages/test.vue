<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">测试页面</h1>
      <p class="text-gray-600 mb-4">如果您看到这个页面，说明基本功能正常。</p>
      
      <div class="space-y-2">
        <p class="text-sm">
          <strong>环境变量测试:</strong>
        </p>
        <p class="text-xs text-gray-500">
          Stripe Public Key: {{ stripeKeyExists ? '✅ 存在' : '❌ 缺失' }}
        </p>
        <p class="text-xs text-gray-500">
          Supabase URL: {{ supabaseExists ? '✅ 存在' : '❌ 缺失' }}
        </p>
      </div>
      
      <div class="mt-4">
        <NuxtLink to="/" class="text-blue-600 hover:text-blue-800">
          返回首页
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const runtimeConfig = useRuntimeConfig()

const stripeKeyExists = computed(() => {
  return !!(runtimeConfig.public.stripe && runtimeConfig.public.stripe.key)
})

const supabaseExists = computed(() => {
  return !!(runtimeConfig.public.supabase && runtimeConfig.public.supabase.url)
})

useHead({
  title: '测试页面 - Ali Express'
})
</script>
