export default functionNuxtRouteMiddleware((format, to) => {
  const user = useSupabaseUser();

  if (!user.value && to.fullPath == "/checkout") {
    return navigateTo("/auth");
  }
});
