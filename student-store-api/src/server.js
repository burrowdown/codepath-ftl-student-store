const express = require("express")
const cors = require("cors")

const productsRouter = require("./routes/products")
const ordersRouter = require("./routes/orders")
const orderItemsRouter = require("./routes/orderItems")

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.send("Welcome to the Student Store API")
})

app.use("/products", productsRouter)
app.use("/orders", ordersRouter)
app.use("/order-items", orderItemsRouter)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
