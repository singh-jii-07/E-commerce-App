import express from "express";
import {
  createOrder,
  createOrderRazorpay,
  verifyRazorpay,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/Order.js";
import auth from "../middleware/Auth.js";
import isadmin from "../middleware/isadmin.js";

const orderRoute = express.Router();

// Order creation & payment routes
orderRoute.post("/create", auth, createOrder);
orderRoute.post("/create-razorpay", auth, createOrderRazorpay);
orderRoute.post("/verify", auth, verifyRazorpay);

// Order fetching & management routes
orderRoute.get("/get", auth, getMyOrders);
orderRoute.get("/getbyid/:id", auth, getOrderById);
orderRoute.delete("/cancel/:orderId", auth, cancelOrder);
orderRoute.get("/all", auth, isadmin, getAllOrders);
orderRoute.put("/update/:id", auth, isadmin, updateOrderStatus);

export default orderRoute;