const express = require("express");
const OrderItem = require("../models/orderItem");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const items = await OrderItem.list();
    res.json(items);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
