# Stripe支付快速参考卡 🚀

## 🔧 快速设置

### 安装依赖
```bash
npm install @stripe/stripe-js stripe
```

### 环境变量
```env
STRIPE_PUBLIC_KEY="pk_test_xxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxx"
```

## 💳 测试卡号
```
成功: 4242 4242 4242 4242
拒绝: 4000 0000 0000 9995
验证: 4000 0025 0000 3155
```

## 🎯 核心流程

### 1. 前端初始化
```javascript
import { loadStripe } from '@stripe/stripe-js'

const stripe = ref(null)
stripe.value = await loadStripe(publicKey)
```

### 2. 创建PaymentIntent
```javascript
const response = await $fetch("/api/stripe/paymentintent", {
  method: "POST",
  body: { amount: 1000 } // $10.00
})
```

### 3. 设置Elements
```javascript
const elements = stripe.value.elements({ 
  clientSecret: response.client_secret 
})
const card = elements.create("card")
card.mount("#card-element")
```

### 4. 确认支付
```javascript
const result = await stripe.value.confirmCardPayment(clientSecret, {
  payment_method: { card: card }
})
```

## ⚠️ 常见陷阱

1. **金额单位**：使用分（cents），不是元
2. **私钥安全**：仅在后端使用
3. **响应式数据**：使用 `ref()` 包装
4. **错误处理**：每个异步操作都要try-catch

## 🔍 调试技巧

```javascript
// 检查Stripe对象
console.log('Stripe实例:', stripe.value)

// 检查金额
console.log('支付金额:', total.value, '分')

// 监听卡片事件
card.on('change', (event) => {
  console.log('卡片状态:', event)
})
```

## 📋 部署前检查

- [ ] 使用生产环境密钥
- [ ] 启用HTTPS
- [ ] 测试真实支付流程
- [ ] 设置错误监控

---
💡 **记住**：先在测试环境完全测试，再切换到生产环境！
