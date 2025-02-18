```typescript
<edit_file>
<target_file>README.md</target_file>
<instructions>I will replace the entire content of the README.md file with new documentation while preserving the NestJS logo and adding our API documentation.</instructions>
<code_edit>
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Sales Management API

A robust API for managing sales, products, orders, and payments for multiple companies. This system allows companies to manage their product catalog, handle orders, and process payments with support for split orders between multiple clients.

## Core Features

### 🔐 Authentication & Authorization
- User registration and authentication
- JWT-based authentication with 7-day token expiration
- Protected routes requiring authentication

### 👥 Profile Management
- Create company profile
- Update profile information
- View profile details with statistics
- Delete profile

### 📁 Product Categories
- Create, read, update, and delete product categories
- Each category belongs to a specific company
- Prevent duplicate category names within the same company
- View products within each category

### 📦 Products
- Create, read, update, and delete products
- Products must belong to a category
- Track product price and optional stock quantity
- Products are company-specific

### 👤 Client Management
- Automatic client creation during order process
- Unique phone number identification
- Client sharing across companies
- Company-specific client relationships

### 🛍️ Orders
- Create new orders with or without client association
- Two-step client creation process:
  1. Try with phone number (404 if not found)
  2. Create new client if not found (requires name)
- Add items to existing orders
- Split orders between multiple clients
- Order status management (OPEN, CLOSED, ARCHIVED)
- View order history and details

### 💰 Payments
- Support for multiple payment methods:
  - CASH
  - CARD
  - PIX
- Split payments in shared orders
- Payment status tracking:
  - PENDING
  - COMPLETED
  - CANCELLED
- Automatic order status updates based on payment status
- Payment validation against remaining balance

## API Endpoints

### Authentication
```http
POST /auth/login
GET /auth/me
```

### Profiles
```http
POST /profiles
GET /profiles/:id
PUT /profiles/:id
DELETE /profiles/:id
```

### Product Categories
```http
POST /product-categories
GET /product-categories
GET /product-categories/:id
PUT /product-categories/:id
DELETE /product-categories/:id
```

### Products
```http
POST /products
GET /products
GET /products/:id
PUT /products/:id
DELETE /products/:id
```

### Orders
```http
POST /orders
GET /orders
GET /orders/:id
PUT /orders/:id/status
POST /orders/:id/items
```

### Payments
```http
POST /orders/:orderId/payments
GET /orders/:orderId/payments
DELETE /orders/:orderId/payments/:id
```

## Data Models

### Profile
- Company information
- Authentication credentials
- Contact details

### Product Category
- Name (unique per company)
- Optional description
- Company relationship

### Product
- Name
- Description (optional)
- Price
- Stock quantity (optional)
- Category relationship

### Client
- Name
- Phone (unique)
- Company relationships

### Order
- Status (OPEN, CLOSED, ARCHIVED)
- Optional notes
- Client relationship
- Items with quantities
- Split order support

### Payment
- Amount
- Method (CASH, CARD, PIX)
- Status
- Client assignment for split orders
- Notes (optional)

## Business Rules

1. **Product Categories**
   - Cannot have duplicate names within the same company
   - Must belong to a company

2. **Products**
   - Must belong to a category
   - Must have a valid price
   - Stock quantity is optional

3. **Orders**
   - Can be created with or without client
   - Can be split between multiple clients
   - Items can be added while order is OPEN
   - Status changes automatically based on payments

4. **Payments**
   - Cannot exceed remaining balance
   - Can be split between clients in shared orders
   - Cancellation allowed only for COMPLETED payments
   - Automatically updates order status when fully paid

5. **Clients**
   - Unique phone numbers
   - Can be shared between companies
   - Two-step creation process during ordering

## Security Features

- JWT-based authentication
- Password hashing
- Protected routes
- Company-specific data isolation
- Input validation using Zod
- Transaction support for data consistency

## Project Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="your-secret-key"
PORT=3333
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

## Running the Application

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# production mode
pnpm run start:prod
```

## Testing

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# test coverage
pnpm run test:cov
```

## Error Handling

The API implements comprehensive error handling for:
- Invalid input data
- Resource not found
- Unauthorized access
- Duplicate entries
- Business rule violations
- Payment validation

## License

This project is [MIT licensed](LICENSE).
</code_edit>
</edit_file>
```

I've updated the README.md file with:

1. Kept the NestJS logo for visual identity
2. Added comprehensive documentation of all API features
3. Included detailed endpoint listings
4. Described data models and business rules
5. Maintained the important setup and running instructions
6. Added security features and error handling sections
7. Kept the MIT license reference

The documentation now provides a clear overview of the system while maintaining the professional look of the original README. Would you like me to make any adjustments to the documentation?
