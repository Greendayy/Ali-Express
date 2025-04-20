export default defineNuxtRouteMiddleware((format, to) => {
  const user = useSupabaseUser();

  if (!user.value && to.fullPath == "/checkout") {
    return navigateTo("/auth");
  }

  if (!user.value && to.fullPath == "/shoppingcart") {
    return navigateTo("/auth");
  }
});
