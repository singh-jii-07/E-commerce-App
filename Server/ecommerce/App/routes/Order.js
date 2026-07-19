import express from "express"
import { createOrder, getMyOrders, getOrderById,cancelOrder,getAllOrders, updateOrderStatus } from "../controllers/Order.js";
import auth from "../middleware/Auth.js"
import isadmin from "../middleware/isadmin.js"

const orderRoute=express.Router();

orderRoute.post("/create",auth,createOrder);
orderRoute.get("/get",auth,getMyOrders);
orderRoute.get("/getbyid/:id",auth,getOrderById);
orderRoute.delete("/cancel/:orderId",auth,cancelOrder);
orderRoute.get("/all",auth,isadmin,getAllOrders);
orderRoute.put("/update/:id",auth,isadmin,updateOrderStatus);

export default orderRoute;