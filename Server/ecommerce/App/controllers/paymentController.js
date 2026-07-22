import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import razorpay from "../utils/razorpay.js";

const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;   

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid.",
      });
    }

    const options = {
      amount: Math.round(order.totalAmount * 100),
      currency: "INR",
      receipt: order._id.toString(),
    };

    const razorpayOrder = await razorpay.orders.create(options);

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Razorpay Order Created Successfully.",
      order: razorpayOrder,
    });

  } catch (error) {
    console.error("CREATE RAZORPAY ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Check Required Fields
    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Find Order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Already Paid
    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid.",
      });
    }

    // Verify Razorpay Signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET is not set in environment variables!");
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    console.log("---- Razorpay Verification Debug ----");
    console.log("razorpay_order_id:", razorpay_order_id);
    console.log("razorpay_payment_id:", razorpay_payment_id);
    console.log("Received signature:", razorpay_signature);
    console.log("Generated signature:", generatedSignature);
    console.log("Signature match:", generatedSignature === razorpay_signature);
    console.log("-------------------------------------");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed.",
        debug: {
          razorpay_order_id,
          razorpay_payment_id,
          receivedSignature: razorpay_signature,
          generatedSignature: generatedSignature,
        }
      });
    }

    // Update Order
    order.paymentStatus = "Paid";
    order.orderStatus = "Confirmed";
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paidAt = new Date();

    await order.save();

    // Reduce Product Stock safely
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const productId = item.product?._id || item.product;
        const product = await Product.findById(productId);

        if (!product) continue;

        product.stock = Math.max(0, (product.stock || 0) - item.quantity);
        await product.save();
      }
    }

    // Clear User Cart in Cart collection
    if (order.user) {
      await Cart.deleteMany({ user: order.user });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      data: order,
    });

  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};

export { createRazorpayOrder, verifyPayment };