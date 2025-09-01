# Stripe支付接入完整指南 📚

## 目录
1. [前期准备](#前期准备)
2. [环境配置](#环境配置)
3. [前端集成](#前端集成)
4. [后端API](#后端API)
5. [常见问题及解决方案](#常见问题及解决方案)
6. [安全注意事项](#安全注意事项)
7. [测试指南](#测试指南)
8. [生产部署](#生产部署)

## 前期准备

### 1. 注册Stripe账户
- 访问 [Stripe官网](https://stripe.com) 注册账户
- 完成邮箱验证
- 获取测试环境的API密钥

### 2. 获取API密钥
```
测试环境密钥格式：
- 公钥：pk_test_xxxxx
- 私钥：sk_test_xxxxx

生产环境密钥格式：
- 公钥：pk_live_xxxxx
- 私钥：sk_live_xxxxx
```

**⚠️ 重要提示：私钥绝不能暴露在前端代码中！**

## 环境配置

### 1. 安装必要依赖
```bash
# 前端Stripe SDK
npm install @stripe/stripe-js

# 后端Stripe SDK
npm install stripe
```

### 2. 环境变量配置 (.env)
```env
# Stripe配置
STRIPE_PUBLIC_KEY="pk_test_your_public_key_here"
STRIPE_SECRET_KEY="sk_test_your_secret_key_here"

# 其他配置...
SUPABASE_URL="your_supabase_url"
SUPABASE_KEY="your_supabase_key"
DATABASE_URL="your_database_url"
```

### 3. Nuxt配置 (nuxt.config.js)
```javascript
export default defineNuxtConfig({
  modules: [
    "@unlok-co/nuxt-stripe", // 可选：使用Nuxt Stripe模块
    // 其他模块...
  ],
  
  runtimeConfig: {
    public: {
      stripe: { key: process.env.STRIPE_PUBLIC_KEY },
    },
    stripe: {
      key: process.env.STRIPE_SECRET_KEY,
      options: {},
    },
  },
  
  // 可选：通过CDN加载Stripe
  app: {
    head: {
      script: [{ src: "https://js.stripe.com/v3/", defer: true }],
    },
  },
})
```

## 前端集成

### 1. 页面结构 (checkout.vue)
```vue
<template>
  <div id="CheckoutPage">
    <!-- 地址信息 -->
    <div class="shipping-address">
      <!-- 用户地址显示 -->
    </div>
    
    <!-- 订单摘要 -->
    <div class="order-summary">
      <div>总计: ${{ total / 100 }}</div>
    </div>
    
    <!-- 支付表单 -->
    <form @submit.prevent="pay()">
      <!-- Stripe卡片元素容器 -->
      <div id="card-element"></div>
      
      <!-- 错误显示 -->
      <p id="card-error" class="text-red-700"></p>
      
      <!-- 提交按钮 -->
      <button 
        :disabled="isProcessing" 
        type="submit"
        class="pay-button"
      >
        <Icon v-if="isProcessing" name="eos-icons:loading" />
        <div v-else>立即支付</div>
      </button>
    </form>
  </div>
</template>
```

### 2. 核心逻辑实现
```vue
<script setup>
import { loadStripe } from '@stripe/stripe-js'
import { useUserStore } from "~/stores/user"

// 状态管理
const userStore = useUserStore()
const user = useSupabaseUser()
const runtimeConfig = useRuntimeConfig()

// 响应式数据
const stripe = ref(null)
const total = ref(0)
const isProcessing = ref(false)
const currentAddress = ref(null)

// Stripe相关变量
let elements = null
let card = null
let clientSecret = null

// 生命周期钩子
onMounted(async () => {
  // 计算总金额
  userStore.checkout.forEach((item) => {
    total.value += item.price
  })

  // 初始化Stripe
  if (total.value > 0) {
    await initializeStripe()
  }
})

// Stripe初始化
const initializeStripe = async () => {
  if (stripe.value) return // 避免重复初始化
  
  try {
    // 加载Stripe实例
    stripe.value = await loadStripe(runtimeConfig.public.stripe.key)
    
    if (stripe.value && total.value > 0) {
      await setupStripeElements()
    }
  } catch (error) {
    console.error('Stripe初始化失败:', error)
    showError('支付系统初始化失败')
  }
}

// 设置Stripe Elements
const setupStripeElements = async () => {
  try {
    // 创建PaymentIntent
    const response = await $fetch("/api/stripe/paymentintent", {
      method: "POST",
      body: { amount: total.value },
    })

    clientSecret = response.client_secret

    // 创建Elements实例
    elements = stripe.value.elements({ clientSecret })

    // 创建卡片元素
    const cardStyle = {
      base: {
        fontSize: "18px",
        color: "#424770",
        "::placeholder": { color: "#aab7c4" },
      },
      invalid: {
        color: "#9e2146",
        iconColor: "#fa755a",
      },
    }

    card = elements.create("card", {
      hidePostalCode: true,
      style: cardStyle,
    })

    // 挂载到DOM
    card.mount("#card-element")

    // 监听卡片变化
    card.on("change", function (event) {
      const button = document.querySelector("button[type='submit']")
      button.disabled = event.empty
      
      const errorElement = document.querySelector("#card-error")
      errorElement.textContent = event.error ? event.error.message : ""
    })

    isProcessing.value = false
  } catch (error) {
    console.error('Stripe Elements设置失败:', error)
    showError('支付表单设置失败')
  }
}

// 支付处理
const pay = async () => {
  // 验证地址
  if (!currentAddress.value?.data) {
    showError("请先添加收货地址")
    return
  }
  
  // 验证支付系统就绪
  if (!stripe.value || !clientSecret) {
    showError("支付系统未就绪，请稍后再试")
    return
  }
  
  isProcessing.value = true

  try {
    // 确认支付
    const result = await stripe.value.confirmCardPayment(clientSecret, {
      payment_method: { card: card },
    })

    if (result.error) {
      showError(result.error.message)
    } else {
      // 支付成功，创建订单
      await createOrder(result.paymentIntent.id)
      
      // 清空购物车
      userStore.cart = []
      userStore.checkout = []
      
      // 跳转到成功页面
      setTimeout(() => {
        navigateTo("/success")
      }, 500)
    }
  } catch (error) {
    console.error('支付失败:', error)
    showError('支付失败，请重试')
  } finally {
    isProcessing.value = false
  }
}

// 创建订单
const createOrder = async (stripeId) => {
  await useFetch("/api/prisma/create-order", {
    method: "POST",
    body: {
      userId: user.value.id,
      stripeId: stripeId,
      name: currentAddress.value.data.name,
      address: currentAddress.value.data.address,
      zipcode: currentAddress.value.data.zipcode,
      city: currentAddress.value.data.city,
      country: currentAddress.value.data.country,
      products: userStore.checkout,
    },
  })
}

// 错误显示
const showError = (message) => {
  const errorElement = document.querySelector("#card-error")
  errorElement.textContent = message
  
  setTimeout(() => {
    errorElement.textContent = ""
  }, 4000)
}
</script>
```

## 后端API

### 1. PaymentIntent API (server/api/stripe/paymentintent.js)
```javascript
import Stripe from "stripe"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  try {
    // 创建支付意图
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(body.amount), // 金额（分为单位）
      currency: "usd", // 货币
      automatic_payment_methods: { 
        enabled: true 
      },
    })

    return {
      client_secret: paymentIntent.client_secret
    }
  } catch (error) {
    console.error('PaymentIntent创建失败:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Payment Intent creation failed'
    })
  }
})
```

### 2. 订单创建API (server/api/prisma/create-order.js)
```javascript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    // 创建订单记录
    const order = await prisma.orders.create({
      data: {
        userId: body.userId,
        stripeId: body.stripeId,
        name: body.name,
        address: body.address,
        zipcode: body.zipcode,
        city: body.city,
        country: body.country,
        // 其他订单信息...
      }
    })

    // 创建订单商品记录
    for (const product of body.products) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          // 其他商品信息...
        }
      })
    }

    return { success: true, orderId: order.id }
  } catch (error) {
    console.error('订单创建失败:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Order creation failed'
    })
  }
})
```

## 常见问题及解决方案

### 1. "Invalid watch source: null"错误
**问题原因**：试图监听非响应式对象
```javascript
// ❌ 错误写法
let stripe = null
watch(stripe, callback)

// ✅ 正确写法
const stripe = ref(null)
watch(stripe, callback)
```

### 2. Stripe未定义错误
**解决方案**：确保Stripe正确加载
```javascript
// 检查Stripe是否可用
if (process.client && window.Stripe) {
  // 使用全局Stripe
} else {
  // 使用loadStripe
  const stripe = await loadStripe(publicKey)
}
```

### 3. 金额计算问题
**注意**：Stripe使用最小货币单位（如美分）
```javascript
// ✅ 正确：$10.00 = 1000分
const amount = 1000

// ❌ 错误：直接使用美元
const amount = 10
```

### 4. 卡片元素挂载失败
**解决方案**：确保DOM元素存在
```javascript
// 等待DOM准备就绪
await nextTick()
card.mount("#card-element")
```

## 安全注意事项

### 1. 密钥管理
- ✅ 公钥可以在前端使用
- ❌ 私钥绝不能暴露在前端
- ✅ 使用环境变量存储敏感信息
- ✅ 生产环境使用live密钥

### 2. 数据验证
```javascript
// 后端验证
if (!body.amount || body.amount < 50) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Invalid amount'
  })
}
```

### 3. 错误处理
- 不要在前端显示详细的错误信息
- 记录详细错误到服务器日志
- 向用户显示友好的错误消息

## 测试指南

### 1. 测试卡号
```
成功支付：4242 4242 4242 4242
需要验证：4000 0025 0000 3155
被拒绝：4000 0000 0000 9995
```

### 2. 测试流程
1. 使用测试卡号填写表单
2. 过期日期使用未来日期
3. CVV使用任意3位数字
4. 邮编使用任意5位数字

### 3. 验证要点
- [ ] 支付成功后订单创建
- [ ] 失败支付的错误处理
- [ ] 用户体验流畅性
- [ ] 移动端兼容性

## 生产部署

### 1. 环境切换
```env
# 生产环境配置
STRIPE_PUBLIC_KEY="pk_live_xxxxx"
STRIPE_SECRET_KEY="sk_live_xxxxx"
```

### 2. Webhook配置（可选但推荐）
```javascript
// server/api/stripe/webhook.js
export default defineEventHandler(async (event) => {
  const sig = getHeader(event, 'stripe-signature')
  const payload = await readRawBody(event)
  
  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      payload, sig, process.env.STRIPE_WEBHOOK_SECRET
    )
    
    // 处理不同事件类型
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        // 处理支付成功
        break
      case 'payment_intent.payment_failed':
        // 处理支付失败
        break
    }
  } catch (error) {
    console.error('Webhook验证失败:', error)
  }
})
```

### 3. 部署检查清单
- [ ] 使用生产环境密钥
- [ ] 启用HTTPS
- [ ] 设置Webhook端点
- [ ] 配置域名白名单
- [ ] 测试支付流程

## 总结

Stripe集成的关键点：
1. **正确的环境配置**：公钥前端，私钥后端
2. **响应式数据管理**：使用Vue3的ref/reactive
3. **错误处理**：全面的try-catch和用户友好提示
4. **安全性**：验证、日志、敏感数据保护
5. **测试**：使用测试卡号充分测试各种场景

记住：支付集成涉及用户资金安全，每一步都要仔细测试！

---
📝 **备注**：本指南基于您的项目实际代码编写，可根据具体需求调整。

🔗 **相关链接**：
- [Stripe官方文档](https://stripe.com/docs)
- [Stripe测试卡号](https://stripe.com/docs/testing#cards)
- [Vue3响应式API](https://vuejs.org/guide/reactivity/core.html)
