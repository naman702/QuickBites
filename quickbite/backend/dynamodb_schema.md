# QuickBite — DynamoDB Table Design

## Table 1: Orders

| Attribute | Type | Description |
|-----------|------|-------------|
| `orderId` (PK) | String | Unique order ID (e.g., ORD-A1B2C3) |
| `customerName` | String | Full name of the customer |
| `customerEmail` | String | Email address |
| `customerPhone` | String | Phone with +91 prefix |
| `item` | String | Comma-separated items summary |
| `address` | String | Full formatted address string |
| `deliveryAddress` | Map | Structured address object |
| `deliveryAddress.houseNo` | String | House/Flat number |
| `deliveryAddress.street` | String | Street name |
| `deliveryAddress.area` | String | Area/Locality |
| `deliveryAddress.landmark` | String | Nearby landmark |
| `deliveryAddress.city` | String | Delivery city |
| `deliveryAddress.state` | String | State |
| `deliveryAddress.pincode` | String | 6-digit pincode |
| `deliveryAddress.deliveryNote` | String | Special delivery instructions |
| `deliveryCity` | String | City, State format (e.g., "Una, Gujarat") |
| `cart` | List | Array of cart items with name, price, qty, restaurantId, restaurantName |
| `status` | String | Order status: PLACED → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED |
| `timestamp` | String | ISO 8601 UTC timestamp |

### GSI: email-timestamp-index
- **Partition Key**: `customerEmail` (String)
- **Sort Key**: `timestamp` (String)
- **Purpose**: Fetch all orders for a user, sorted by most recent

---

## Table 2: Restaurants (Future — Currently Frontend-Only)

| Attribute | Type | Description |
|-----------|------|-------------|
| `city` (PK) | String | Normalized city name (e.g., "una", "mumbai") |
| `restaurantId` (SK) | String | Unique restaurant ID |
| `name` | String | Restaurant name |
| `cuisine` | String | Cuisine description |
| `rating` | Number | Rating (1-5) |
| `deliveryTime` | String | Estimated delivery time |
| `priceRange` | String | ₹, ₹₹, or ₹₹₹ |
| `isVeg` | Boolean | Pure veg flag |
| `avgPrice` | Number | Average price per item |
| `offer` | String | Current offer text |
| `coordinates` | Map | { lat: Number, lng: Number } |

### GSI: restaurantId-index
- **Partition Key**: `restaurantId` (String)
- **Purpose**: Look up a restaurant by ID directly

---

## Table 3: Users (Future — Currently Cognito/localStorage)

| Attribute | Type | Description |
|-----------|------|-------------|
| `email` (PK) | String | User email |
| `name` | String | Full name |
| `authMethod` | String | "email" or "google" |
| `createdAt` | String | Account creation timestamp |
| `lastLocation` | Map | { city, state, lat, lng } |
| `savedAddresses` | List | Array of saved delivery addresses |

---

## Current Architecture

```
Frontend (S3 + CloudFront)
    ↓ POST /order
API Gateway
    ↓
Lambda (OrderHandler)
    ↓ PutItem
DynamoDB (Orders table)
    ↓ SendMessage
SQS (OrderQueue)
    ↓ Trigger
Lambda (OrderProcessor)
    ↓
SES (Email Receipt) + SNS (Owner Notification)
```

## Notes
- Restaurant data is currently stored in `restaurants-data.js` on the frontend
- In production, move restaurant data to DynamoDB Restaurants table
- Use DynamoDB Streams to sync restaurant updates to frontend cache
- Consider ElastiCache for frequently accessed restaurant data
