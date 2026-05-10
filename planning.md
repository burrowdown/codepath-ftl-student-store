## Models

(required unless marked optional)

#### Products

- `id`: Int, primary key, autoincrement
- `name`: String, max 80 chars
- `description`: String, max 500 chars
- `price`: Decimal (to two digits) >=0
- `image_url`: String, optional
- `category`: ProductCategory enum, {ACCESSORIES, APPAREL, BOOKS, SNACKS, SUPPLIES}
- `available`: Boolean (instead of deleting products that have historically shipped, mark as false)

#### Orders

- `order_id`: Int, primary key, autoincrement
- `customer_id`: Int (would be foreign key to Customer object in the real world but we're not doing that in this assignment)
- `total_price`: Decimal (to two digits) >=0
- `status`: OrderStatus enum, {PENDING, PAID, SHIPPED, DELIVERED, CANCELED}, default PENDING
- `created_at`: DateTime, default now

#### OrderItems

- `order_item_id`: Int, primary key, autoincrement
- `order_id`: Int, foreign key to Order (cascade on delete) (it's fine to take a deleted product off an order that hasn't been placed yet, happens all the time)
- `product_id`: Int, foreign key to Product (restrict on delete, only delete products that don't have OrderItems associated with an Order with a Shipped or Delivered status)
- `quantity`: Int, default 1, >=1
- `price`: Decimal (to two digits) >=0 (snapshot of Product price at purchase time)

## Endpoints

All error responses will be {"error": "message goes here"}

#### Product endpoints:

- `GET /products`: Fetch a list of all products.
  - success response: 200, the resource
  - include all products, including `available: false`
  - if no products exist, respond 200 with []
- `GET /products/:id`: (url param: product id) Fetch details of a specific
  product by its ID.
  - success response: 200, the resource
  - if not found: 404 with message "invalid product id"
- `POST /products`: Add a new product to the database.
  - post body includes all required fields for a Product (ignore id if included)
  - success response: 201, the resource that has been added
  - if request is malformed: 400
- `PUT /products/:id`: (url param: product id) Update the details of an
  existing product.
  - request body includes some or all of the Product fields
    - if only some are included, update only included fields
    - fields which don't appear on Product can be ignored
    - if no updateable fields are present on request body, respond 400
  - success response: 200, the new state of the resource
  - if product does not exist: 404 with message "invalid product id"
  - if request is malformed: 400
- `DELETE /products/:id`: (url param: product id) Remove a product from the
  database.
  - success response: 200, copy of the deleted resource
  - if product doesn't exist, respond 404
  - if there are any Orders that include this product and have states SHIPPED or DELIVERED, do not delete product, respond 409 with message "Cannot delete products which have been purchased. Mark `available: false` instead."

#### Order endpoints:

- `GET /orders`: Fetch a list of all orders.
  - success response: 200, the resource
- `GET /orders/:order_id`: (url param: order id) Fetch details of a specific order by its ID, including the order items.
  - success response: 200, the resource, include complete child OrderItems
  - if not found: 404 with message "invalid order id"
- `POST /orders`:
  - post body: `{ "customer_id": 123, "items": [{ "product_id": 4, "quantity": 2 } ... ]}`
  - Create a new Order object
  - For each Product, create an OrderItem
    - if a product doesn't exist, respond 422 with message "invalid product id: {product id}"
    - if a Product has `available: false`, respond 409 with message "Sorry, {product name} is not available",
    - if an item has quantity <1, ignore it. If _all_ items have quantity <1, respond 400 with message "Order must include items"
    - if an OrderItem already exists with the same product id, don't create another OrderItem, just add the quantities together
  - if items is [], respond 400 with message "Order must include items"
  - calculate total price, sum(quantity × price of OrderItem)
  - if request is malformed: 400
  - success response: 201, the resource that has been added
- `PUT /orders/:order_id`: (url param: order id) Update the details of an existing order (e.g., change status).
  - request body includes some or all of the Order fields
    - if only some are included, update only included fields
    - fields which don't appear on Order can be ignored
    - if no updateable fields are present on request body, respond 400
  - success response: 200, the new state of the resource
  - if order does not exist: 404 with message "invalid order id"
  - if request is malformed: 400
  - if status update rules aren't followed, respond 409 with message "invalid status change"
    - PENDING orders can become PAID, SHIPPED, CANCELED
    - PAID orders can become SHIPPED, CANCELED
    - SHIPPED orders can become DELIVERED
    - DELIVERED orders cannot change
    - CANCELED orders can become PENDING, PAID
- `DELETE /orders/:order_id`: (url param: order id) Remove an order from the database.
  - success response: 200, copy of the deleted resource
  - if order doesn't exist, respond 404
  - if order has status PAID, SHIPPED, or DELIVERED, don't delete, respond 409 with message "Cannot delete orders which have been {status in lower case}. Mark order as canceled instead."
