import { prisma } from "~/lib/prisma.js";

export default defineEventHandler(async (event) => {
  try {
    let products = await prisma.products.findMany();
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch products: ' + error.message
    });
  }
});
