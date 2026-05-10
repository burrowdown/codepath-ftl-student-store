const prisma = require("../db/db");

class OrderItem {
  static async list({ orderId } = {}) {
    const where = {};
    if (orderId !== undefined) where.orderId = orderId;
    return prisma.orderItem.findMany({ where });
  }

  static async get(id) {
    return prisma.orderItem.findUnique({ where: { id } });
  }

  static async create({ orderId, productId, quantity, price }) {
    return prisma.orderItem.create({
      data: { orderId, productId, quantity, price },
    });
  }
}

module.exports = OrderItem;
