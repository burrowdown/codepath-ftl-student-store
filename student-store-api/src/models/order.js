const prisma = require("../db/db");
const { Prisma } = require("@prisma/client");

const STATUS_TRANSITIONS = {
  PENDING: ["PENDING", "PAID", "SHIPPED", "CANCELED"],
  PAID: ["PAID", "SHIPPED", "CANCELED"],
  SHIPPED: ["SHIPPED", "DELIVERED"],
  DELIVERED: ["DELIVERED"],
  CANCELED: ["CANCELED", "PENDING", "PAID"],
};

const UNDELETABLE_STATUSES = ["PAID", "SHIPPED", "DELIVERED"];

class Order {
  static async list() {
    return prisma.order.findMany();
  }

  static async get(id) {
    return prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });
  }

  static async create({ customerId, items }) {
    if (!Array.isArray(items)) {
      throwError("ORDER_EMPTY_ITEMS", "Order must include items");
    }

    const validItems = items.filter(
      (it) =>
        it &&
        Number.isInteger(it.productId) &&
        Number.isInteger(it.quantity) &&
        it.quantity >= 1
    );
    if (validItems.length === 0) {
      throwError("ORDER_EMPTY_ITEMS", "Order must include items");
    }

    const merged = new Map();
    for (const item of validItems) {
      merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
    }

    const productIds = [...merged.keys()];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const pid of productIds) {
      if (!productMap.has(pid)) {
        throwError(
          "ORDER_INVALID_PRODUCT",
          `invalid product id: ${pid}`,
          { productId: pid }
        );
      }
    }

    for (const product of products) {
      if (!product.available) {
        throwError(
          "ORDER_UNAVAILABLE_PRODUCT",
          `Sorry, ${product.name} is not available`,
          { productId: product.id }
        );
      }
    }

    let totalPrice = new Prisma.Decimal(0);
    const orderItemsData = [];
    for (const [productId, quantity] of merged) {
      const product = productMap.get(productId);
      totalPrice = totalPrice.plus(product.price.times(quantity));
      orderItemsData.push({ productId, quantity, price: product.price });
    }

    return prisma.order.create({
      data: {
        customerId,
        totalPrice,
        orderItems: { create: orderItemsData },
      },
      include: { orderItems: true },
    });
  }

  static async update(id, data) {
    if (data.status !== undefined) {
      const current = await prisma.order.findUnique({ where: { id } });
      if (!current) {
        throwError("P2025", "order not found");
      }
      const allowed = STATUS_TRANSITIONS[current.status] ?? [];
      if (!allowed.includes(data.status)) {
        throwError("ORDER_INVALID_STATUS_TRANSITION", "invalid status change");
      }
    }

    return prisma.order.update({
      where: { id },
      data,
      include: { orderItems: true },
    });
  }

  static async delete(id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });
    if (!order) {
      throwError("P2025", "order not found");
    }

    if (UNDELETABLE_STATUSES.includes(order.status)) {
      throwError(
        "ORDER_DELETE_BLOCKED",
        `Cannot delete orders which have been ${order.status.toLowerCase()}. Mark order as canceled instead.`
      );
    }

    await prisma.order.delete({ where: { id } });
    return order;
  }
}

function throwError(code, message, extras = {}) {
  const err = new Error(message);
  err.code = code;
  Object.assign(err, extras);
  throw err;
}

module.exports = Order;
