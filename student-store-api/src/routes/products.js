const express = require("express");
const { Prisma } = require("@prisma/client");
const Product = require("../models/product");

const router = express.Router();

const UPDATEABLE_FIELDS = [
  "name",
  "description",
  "price",
  "imageUrl",
  "category",
  "available",
];

router.get("/", async (req, res, next) => {
  try {
    const products = await Product.list();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return notFound(res);
    const product = await Product.get(id);
    if (!product) return notFound(res);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = pickFields(req.body, UPDATEABLE_FIELDS);
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) {
    if (isClientInputError(err)) return badRequest(res);
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return notFound(res);

    const data = pickFields(req.body, UPDATEABLE_FIELDS);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "no updateable fields provided" });
    }

    const product = await Product.update(id, data);
    res.json(product);
  } catch (err) {
    if (err.code === "P2025") return notFound(res);
    if (isClientInputError(err)) return badRequest(res);
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return notFound(res);

    const deleted = await Product.delete(id);
    res.json(deleted);
  } catch (err) {
    if (err.code === "PRODUCT_DELETE_BLOCKED") {
      return res.status(409).json({ error: err.message });
    }
    if (err.code === "P2025") return notFound(res);
    next(err);
  }
});

function parseId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 && String(id) === value ? id : null;
}

function pickFields(body, allowed) {
  const data = {};
  if (!body || typeof body !== "object") return data;
  for (const field of allowed) {
    if (field in body) data[field] = body[field];
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
  return res.status(404).json({ error: "invalid product id" });
}

function badRequest(res) {
  return res.status(400).json({ error: "invalid request body" });
}

module.exports = router;
