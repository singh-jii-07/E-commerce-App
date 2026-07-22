import express from "express"
import { createRazorpayOrder, verifyPayment } from "../controllers/paymentController.js";
import auth from "../middleware/Auth.js"

const paymentRoute =express.Router();

paymentRoute.post("/create",auth,createRazorpayOrder);
paymentRoute.post("/verify",auth,verifyPayment);

export default paymentRoute;