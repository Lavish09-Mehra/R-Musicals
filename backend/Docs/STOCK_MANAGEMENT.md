# Stock & Inventory Management — R Musicals Backend

This document covers the stock lifecycle, the owner inventory APIs, and every
response change introduced by stock management. Existing endpoints keep their
original response shapes — all changes are **additive** unless listed below.

## Stock lifecycle (one consistent strategy)

| Stage | What happens |
|---|---|
| Product created (`POST /api/products`, owner) | `stock` is optional; missing stock **defaults to 0** (never unlimited). Must be a whole number ≥ 0. |
| Add to cart (`POST /api/cart`) | Stock is **validated only** — never reserved or deducted. Re-adding an existing item checks the **new total** (existing + requested) against live stock. |
| Update cart quantity (`PATCH /api/cart/:product_id`) | Same validation: quantity must be a positive integer and ≤ current stock. |
| Checkout (`POST /api/order`, `POST /api/order/direct`) | Stock is **revalidated**, prices/totals are recomputed from the DB, then units are **atomically deducted** with a conditional update (`stock >= qty`). Concurrent checkouts can never oversell — the loser of the race gets `409`. Failed orders never leave stock half-deducted (compensation rollback). |
| Cancel (`PATCH /api/orders/:orderId/cancel`) | Units are added back **exactly once**, guarded by the order's `stockRestored` flag which flips in the same atomic update that cancels the order. Repeated cancel requests / duplicate callbacks can never double-restock. |
| Account deletion (`DELETE /api/user/:id/delete`) | Active orders are cancelled through the same guarded helper, so their stock is restored exactly once. |

Order documents carry two bookkeeping flags (never settable by clients):

- `stockDeducted` — `true` once units were deducted at checkout. **Legacy
  orders created before stock management stay `false`**, so cancelling them
  does not add phantom stock.
- `stockRestored` — `true` once units were added back.

Optional idempotency: send a `requestId` (any unique string, e.g. a UUID) in
the checkout body. Retrying with the same `requestId` returns the already
created order (`200`) instead of creating a duplicate and deducting twice.

## Payments (Razorpay)

There is **no payment gateway integrated yet** — `paymentMethod` is `COD` or
`ONLINE`, and `paymentStatus` stays `PENDING` after checkout. Nothing faked,
no credentials invented. The flow is ready for Razorpay later:

- `paymentStatus` (`PENDING/PAID/FAILED/REFUNDED`) is already separate from
  `orderStatus`.
- A future `/api/payment/verify` endpoint should only flip
  `paymentStatus` → `PAID` after **server-side signature verification**, and
  failed payments should reuse the guarded cancel (restores stock once).
- Stock is deducted at placement, so a paid order always has reserved units.

## Inventory APIs (owner only)

All require `Authorization: Bearer <accessToken>` of a user with `role: "owner"`.
Customers receive `401` (no/invalid token) or `403` (not owner).

### `GET /api/inventory`

Full stock overview, lowest stock first.

```json
// 200
{
  "count": 2,
  "inventory": [
    {
      "_id": "665f...",
      "name": "Acoustic Guitar",
      "Category": "String",
      "brand": "Yamaha",
      "image": "https://...",
      "price": 12999,
      "discount": 10,
      "finalPrice": 11699.1,
      "stock": 0,
      "lowStockThreshold": 5,
      "lowStock": true,
      "updatedAt": "2026-10-12T09:30:00.000Z"
    }
  ]
}
```

### `GET /api/inventory/low-stock`

Products where `stock <= lowStockThreshold` (per-product threshold, default 5).

```json
// 200 (empty case also 200)
{
  "count": 1,
  "inventory": [ { "_id": "665f...", "name": "Tabla Set", "stock": 2, "lowStockThreshold": 5, "lowStock": true, "...": "..." } ]
}
```

### `GET /api/inventory/:productId`

```json
// 200
{ "inventory": { "_id": "665f...", "name": "Keyboard", "stock": 12, "lowStockThreshold": 5, "lowStock": false, "...": "..." } }
// 400 invalid ObjectId, 404 unknown product
```

### `PATCH /api/inventory/:productId`

Body accepts `stock`, `lowStockThreshold`, or both (whole numbers ≥ 0):

```json
{ "stock": 12, "lowStockThreshold": 3 }
```

```json
// 200
{
  "message": "✅ Inventory updated successfully!",
  "inventory": { "_id": "665f...", "stock": 12, "lowStockThreshold": 3, "lowStock": false, "...": "..." }
}
// 400 invalid values / empty body, 403 non-owner, 404 unknown product
```

## Other response changes (unavoidable, additive)

- **Products** (`GET /api/products`, `GET /api/product/:id`, category,
  create/update responses) now include `stock` and `lowStockThreshold`.
- **Cart items** (`GET/POST/PATCH /api/cart...`) now include
  `availableStock` and `inStock` per item so the UI can flag sold-out lines.
- **Orders** now include `stockDeducted`, `stockRestored`.
- New status codes: `409 Conflict` for out-of-stock/unsafe-delete situations
  (previously some of these returned `400`), `400` with schema messages for
  invalid quantities, `409` for deleting a product that still has active
  orders.
- `500` error bodies now return `error: err.message` instead of the whole
  error object (no stack traces / internals leak).

## Migration

Run once after pulling this change (idempotent, safe to re-run):

```
npm run migrate:stock
```

- Products missing `stock` → set to `0` (missing never means unlimited).
- Products missing `lowStockThreshold` → set to `5`.

## Not implemented (honest list)

- Razorpay integration (no credentials exist in this repo).
- Returns/refunds: cancelling a **PAID** order restores stock but does not
  move money; `paymentStatus` is left untouched until a gateway exists.
- Shipment/return "goods confirmed sellable" flow does not exist yet; stock
  restoration currently happens only on cancellation of `PLACED`/`CONFIRMED`
  orders.
