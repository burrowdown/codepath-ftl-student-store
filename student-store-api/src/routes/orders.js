const express = require("express");
const { Prisma } = require("@prisma/client");
const Order = require("../models/order");

const router = express.Router();

const UPDATEABLE_FIELD_MAP = {
  customer_id: "customerId",
  total_price: "totalPrice",
  status: "status",
  created_at: "createdAt",
};

router.get("/", async (req, res, next) => {
  try {
    const orders = await Order.list();
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.get("/:order_id", async (req, res, next) => {
  try {
    const id = parseId(req.params.order_id);
    if (id === null) return notFound(res);
    const order = await Order.get(id);
    if (!order) return notFound(res);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = req.body || {};
    const customerId = body.customer_id;
    const items = Array.isArray(body.items)
      ? body.items.map((it) => ({
          productId: it && it.product_id,
          quantity: it && it.quantity,
        }))
      : body.items;

    const order = await Order.create({ customerId, items });
    res.status(201).json(order);
  } catch (err) {
    if (err.code === "ORDER_EMPTY_ITEMS") {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === "ORDER_INVALID_PRODUCT") {
      return res.status(422).json({ error: err.message });
    }
    if (err.code === "ORDER_UNAVAILABLE_PRODUCT") {
      return res.status(409).json({ error: err.message });
    }
    if (isClientInputError(err)) return badRequest(res);
    next(err);
  }
});

router.put("/:order_id", async (req, res, next) => {
  try {
    const id = parseId(req.params.order_id);
    if (id === null) return notFound(res);

    const data = pickAndMapFields(req.body, UPDATEABLE_FIELD_MAP);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "no updateable fields provided" });
    }

    const order = await Order.update(id, data);
    res.json(order);
  } catch (err) {
    if (err.code === "P2025") return notFound(res);
    if (err.code === "ORDER_INVALID_STATUS_TRANSITION") {
      return res.status(409).json({ error: err.message });
    }
    if (isClientInputError(err)) return badRequest(res);
    next(err);
  }
});

router.post("/:order_id/items", async (req, res, next) => {
  try {
    const orderId = parseId(req.params.order_id);
    if (orderId === null) return notFound(res);

    const body = req.body || {};
    const order = await Order.addItem(orderId, {
      productId: body.product_id,
      quantity: body.quantity,
    });
    res.status(201).json(order);
  } catch (err) {
    if (err.code === "P2025") return notFound(res);
    if (err.code === "ORDER_INVALID_PRODUCT") {
      return res.status(422).json({ error: err.message });
    }
    if (err.code === "ORDER_UNAVAILABLE_PRODUCT" || err.code === "ORDER_NOT_MODIFIABLE") {
      return res.status(409).json({ error: err.message });
    }
    if (err.code === "ORDER_INVALID_QUANTITY") {
      return res.status(400).json({ error: err.message });
    }
    if (isClientInputError(err)) return badRequest(res);
    next(err);
  }
});

router.delete("/:order_id", async (req, res, next) => {
  try {
    const id = parseId(req.params.order_id);
    if (id === null) return notFound(res);

    const deleted = await Order.delete(id);
    res.json(deleted);
  } catch (err) {
    if (err.code === "P2025") return notFound(res);
    if (err.code === "ORDER_DELETE_BLOCKED") {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
});

function parseId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 && String(id) === value ? id : null;
}

function pickAndMapFields(body, fieldMap) {
  const data = {};
  if (!body || typeof body !== "object") return data;
  for (const [snake, camel] of Object.entries(fieldMap)) {
    if (snake in body) {
      let value = body[snake];
      if (camel === "createdAt" && typeof value === "string") {
        value = new Date(value);
      }
      data[camel] = value;
    }
  }
  return data;
}

function isClientInputError(err) {
  if (err instanceof Prisma.PrismaClientValidationError) return true;
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2000") {
    return true;
  }
  return false;
}

function notFound(res) {
  return res.status(404).json({ error: "invalid order id" });
}

function badRequest(res) {
  return res.status(400).json({ error: "invalid request body" });
}

module.exports = router;
