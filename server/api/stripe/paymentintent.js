import { useServerStripe } from "#stripe/server";

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  // console.log("Stripe Secret Key:", runtimeConfig.stripe.key);

  const body = await readBody(event);
  const stripe = await useServerStripe(event);

  // console.info("Stripe instance:", stripe);

  return await stripe.paymentIntents.create({
    amount: Number(body.amount),
    currency: "usd",
    automatic_payment_methods: { enabled: true },
  });
});
