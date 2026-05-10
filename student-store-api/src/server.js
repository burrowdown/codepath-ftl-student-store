const express = require("express")

const productsRouter = require("./routes/products")

const app = express()

app.use(express.json())

app.get("/", (req, res) => {
  res.send("Welcome to the Student Store API")
})

app.use("/products", productsRouter)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
