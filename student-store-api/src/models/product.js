const prisma = require("../db/db");

class Product {
  static async list() {
    return prisma.product.findMany();
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
