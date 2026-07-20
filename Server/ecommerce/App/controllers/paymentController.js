import crypto from "crypto";
import order from "../models/Order.js"
import product from "../models/Product.js"
import user from "../models/User.js"
import razorpay from "../utils/razorpay.js";

 const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Validate Order ID
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID.",
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

    // Check Payment Status
    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid.",
      });
    }

    // Create Razorpay Order
   const options = {
  amount: order.totalAmount * 100, // Convert ₹ to paise
  currency: "INR",
  receipt: order._id.toString(),
};

    const razorpayOrder = await razorpay.orders.create(options);

    // Save Razorpay Order ID
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
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed.",
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

    // Reduce Product Stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);

      if (!product) continue;

      product.stock -= item.quantity;

      await product.save();
    }

    // Clear User Cart
    const user = await User.findById(order.user);

    if (user) {
      user.cart = [];
      await user.save();
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


export {createRazorpayOrder,verifyPayment}