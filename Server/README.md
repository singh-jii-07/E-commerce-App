# 🛒 Grocery E-Commerce Backend

A production-ready Grocery E-Commerce Backend built using **Node.js**, **Express.js**, **MongoDB**, following a **Microservice Architecture**.

This project is divided into two independent backend services:

- 🔐 Authentication Service
- 🛍️ E-Commerce Service

---

# 📂 Project Structure

```text
server/
│
├── auth/
│   ├── src/
│   ├── package.json
│   ├── .env
│   └── server.js
│
├── ecommerce/
│   ├── src/
│   ├── package.json
│   ├── .env
│   └── server.js
│
└── README.md
```

---

# 🚀 Services

## 🔐 Authentication Service

Responsible for user authentication and authorization.

### Features

- User Registration
- Login
- Logout
- Forgot Password
- Reset Password
- JWT Authentication
- OTP Verification
- Email Verification
- Role Management

### Database

```
auth_db
```

Collections

- Users
- OTP

---

## 🛒 E-Commerce Service

Responsible for all business logic.

### Features

- Categories
- Products
- Search
- Filters
- Cart
- Wishlist
- Addresses
- Orders
- Payments
- Reviews
- Notifications
- Contact
- FAQ
- Admin Dashboard

### Database

```
ecommerce_db
```

Collections

- Products
- Categories
- Cart
- Wishlist
- Orders
- Addresses
- Reviews
- Payments
- Notifications
- Contact Messages
- FAQs

---

# 🛠️ Tech Stack

### Backend

- Node.js
- Express.js

### Database

- MongoDB Atlas
- Mongoose

### Authentication

- JWT
- bcrypt
- OTP Verification

### File Storage

- Cloudinary

### Real-Time

- Socket.IO

### Payment

- Razorpay

### Deployment

- Docker
- AWS EC2

---

# 🔄 Architecture

```text
React Native App
        │
        ▼
 ┌───────────────┐
 │ Authentication│
 │    Service    │
 └───────────────┘
        │
        ▼
   JWT Access Token
        │
        ▼
 ┌───────────────┐
 │ E-Commerce    │
 │   Service     │
 └───────────────┘
        │
        ▼
     MongoDB
```

---

# 📌 Ports

| Service | Port |
|----------|------|
| Auth Service | 5000 |
| Ecommerce Service | 5001 |

---

# 👨‍💻 Author

Developed by **Nilesh Kumar**

---