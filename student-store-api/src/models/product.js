const prisma = require("../db/db");
const { ProductCategory } = require("@prisma/client");

class Product {
  static async list({ category, sort, available, search } = {}) {
    if (category !== undefined && !(category in ProductCategory)) {
      return [];
    }

    const where = {};
    if (category !== undefined) where.category = category;
    if (available !== undefined) where.available = available;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const orderBy =
      sort === "price" ? { price: "asc" } :
      sort === "name" ? { name: "asc" } :
      undefined;

    return prisma.product.findMany({ where, orderBy });
  }

  static async get(id) {
    return prisma.product.findUnique({ where: { id } });
  }

  static async create(data) {
    return prisma.product.create({ data });
  }

  static async update(id, data) {
    return prisma.product.update({ where: { id }, data });
  }

  static async delete(id) {
    const blocking = await prisma.orderItem.findFirst({
      where: {
        productId: id,
        order: { status: { in: ["SHIPPED", "DELIVERED"] } },
      },
    });
    if (blocking) {
      const err = new Error(
        "Cannot delete products which have been purchased. Mark `available: false` instead."
      );
      err.code = "PRODUCT_DELETE_BLOCKED";
      throw err;
    }
    const [, deleted] = await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);
    return deleted;
  }
}

module.exports = Product;
