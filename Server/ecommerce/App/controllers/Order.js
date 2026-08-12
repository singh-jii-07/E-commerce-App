import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Address from "../models/Address.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import ReturnRequest from "../models/ReturnRequest.js";
import sendPushNotification from "../utils/sendPushNotification.js";

let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}


const createOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { address, paymentMethod = "COD" } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address is required.",
      });
    }

    const userAddress = await Address.findOne({
      _id: address,
      authUserId: userId,
    });

    if (!userAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const cartItems = await Cart.find({ user: userId }).populate("product");

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    let items = [];
    let totalAmount = 0;

    for (const cartItem of cartItems) {
      const product = cartItem.product;

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found in cart.",
        });
      }

      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is currently unavailable.`,
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} ${product.unit || "unit(s)"} of ${product.name} available.`,
        });
      }

      items.push({
        product: product._id,
        quantity: cartItem.quantity,
        price: product.price,
      });

      totalAmount += product.price * cartItem.quantity;
    }

    const order = await Order.create({
      user: userId,
      items,
      address: userAddress._id,
      totalAmount,
      paymentMethod,
      paymentStatus: "Pending",
      orderStatus: "Pending",
    });

  
    let userDoc = await User.findOne({ authUserId: userId });
    if (!userDoc) {
      userDoc = await User.create({
        authUserId: userId,
      });
    }
    userDoc.orders.push(order._id);
    await userDoc.save();


    for (const cartItem of cartItems) {
      await Product.findByIdAndUpdate(cartItem.product._id, {
        $inc: { stock: -cartItem.quantity },
      });
    }

  
    await Cart.deleteMany({ user: userId });

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};

// Create Order via Razorpay
const createOrderRazorpay = async (req, res) => {
  try {
    const userId = req.userId;
    const { address, orderId } = req.body;

    if (!razorpayInstance) {
      return res.status(500).json({
        success: false,
        message: "Razorpay integration is not configured on the server. Please check environment variables.",
      });
    }

   
    if (orderId) {
      const existingOrder = await Order.findOne({ _id: orderId, user: userId });
      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      const options = {
        amount: Math.round(existingOrder.totalAmount * 100),
        currency: "INR",
        receipt: existingOrder._id.toString(),
      };

      const razorpayOrder = await razorpayInstance.orders.create(options);
      existingOrder.razorpayOrderId = razorpayOrder.id;
      await existingOrder.save();

      return res.status(200).json({
        success: true,
        message: "Razorpay order created.",
        order: razorpayOrder,
        data: existingOrder,
      });
    }

  
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address is required.",
      });
    }

    const userAddress = await Address.findOne({
      _id: address,
      authUserId: userId,
    });

    if (!userAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const cartItems = await Cart.find({ user: userId }).populate("product");

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    let items = [];
    let totalAmount = 0;

    for (const cartItem of cartItems) {
      const product = cartItem.product;

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found in cart.",
        });
      }

      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is currently unavailable.`,
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} ${product.unit || "unit(s)"} of ${product.name} available.`,
        });
      }

      items.push({
        product: product._id,
        quantity: cartItem.quantity,
        price: product.price,
      });

      totalAmount += product.price * cartItem.quantity;
    }

    const order = await Order.create({
      user: userId,
      items,
      address: userAddress._id,
      totalAmount,
      paymentMethod: "Razorpay",
      paymentStatus: "Pending",
      orderStatus: "Pending",
    });

   
    let userDoc = await User.findOne({ authUserId: userId });
    if (!userDoc) {
      userDoc = await User.create({
        authUserId: userId,
      });
    }
    userDoc.orders.push(order._id);
    await userDoc.save();

    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: order._id.toString(),
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    
    for (const cartItem of cartItems) {
      await Product.findByIdAndUpdate(cartItem.product._id, {
        $inc: { stock: -cartItem.quantity },
      });
    }


    await Cart.deleteMany({ user: userId });

    return res.status(201).json({
      success: true,
      message: "Order created with Razorpay successfully.",
      data: order,
      order: razorpayOrder,
    });
  } catch (error) {
    console.error("Create Order Razorpay Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};

// Verify Razorpay Payment
const verifyRazorpay = async (req, res) => {
  try {
    const userId = req.userId;
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId && !razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID or Razorpay order ID is required.",
      });
    }

    let order = null;


    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    }

    if (!order && razorpay_order_id) {
      order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    }

 
    if (!order && razorpay_order_id && mongoose.Types.ObjectId.isValid(razorpay_order_id)) {
      order = await Order.findById(razorpay_order_id);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for given details.",
      });
    }

    // Optionally verify with Razorpay API if instance is available
    if (razorpayInstance) {
      try {
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
        if (orderInfo.status === "paid") {
          order.paymentStatus = "Paid";
        }
      } catch (e) {
        console.log("Razorpay fetch info error:", e.message);
      }
    }

    order.paymentStatus = "Paid";
    order.orderStatus = "Confirmed";
    if (razorpay_payment_id) order.razorpayPaymentId = razorpay_payment_id;
    if (razorpay_signature) order.razorpaySignature = razorpay_signature;
    order.paidAt = new Date();

    await order.save();

    // Clear cart if any remaining items
    await Cart.deleteMany({ user: userId });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Verify Razorpay Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};

// Get My Orders (for logged-in user)
const getMyOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const orders = await Order.find({ user: userId })
      .populate("items.product", "name price images")
      .populate("address")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully.",
      data: orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// Get Single Order details by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    
    const isUserAdmin = req.role && req.role.toLowerCase() === "admin";
    const filter = isUserAdmin ? { _id: id } : { _id: id, user: req.userId };

    const order = await Order.findOne(filter)
      .populate({
        path: "items.product",
        select: "name description price images stock unit isAvailable",
      })
      .populate({
        path: "address",
        select:
          "fullName phone alternatePhone addressLine1 addressLine2 landmark city state country postalCode addressType isDefault",
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Get Order By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel Order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled.",
      });
    }

    if (!["Pending", "Confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is ${order.orderStatus}.`,
      });
    }

    order.orderStatus = "Cancelled";
    await order.save();

   
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    // Trigger Push Notification for Order Cancelled
    try {
      const userDoc = await User.findOne({ authUserId: userId });
      if (userDoc && userDoc.pushToken) {
        const shortId = order._id.toString().slice(-6).toUpperCase();
        const title = "❌ Order Cancelled";
        const body = `Your order #${shortId} has been successfully cancelled.`;
        sendPushNotification(userDoc.pushToken, title, body, {
          orderId: order._id,
          status: "Cancelled",
        });
      }
    } catch (pushErr) {
      console.error("Push notification error on cancel order:", pushErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// Get All Orders (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("items.product", "name price images")
      .populate("address")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully.",
      totalOrders: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// Update Order Status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const allowedStatus = [
      "Pending",
      "Confirmed",
      "Packed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatus.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order Status.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled order cannot be updated.",
      });
    }

    if (order.orderStatus === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivered order cannot be updated.",
      });
    }

    const statusFlow = {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Packed", "Cancelled"],
      Packed: ["Shipped", "Cancelled"],
      Shipped: ["Delivered", "Cancelled"],
      Delivered: [],
      Cancelled: [],
    };

    if (!statusFlow[order.orderStatus].includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be changed from ${order.orderStatus} to ${orderStatus}.`,
      });
    }

    
    if (orderStatus === "Cancelled") {
      for (const item of order.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

    if (orderStatus === "Delivered" && order.paymentMethod === "COD") {
      order.paymentStatus = "Paid";
      order.paidAt = new Date();
    }

    order.orderStatus = orderStatus;
    await order.save();

    // Trigger Push Notification for Order Status Update
    try {
      const userDoc = await User.findOne({ authUserId: order.user });
      if (userDoc && userDoc.pushToken) {
        const shortId = order._id.toString().slice(-6).toUpperCase();
        const title = "📦 Order Status Update";
        const body = `Your order #${shortId} status has been updated to "${orderStatus}".`;
        sendPushNotification(userDoc.pushToken, title, body, {
          orderId: order._id,
          status: orderStatus,
        });
      }
    } catch (pushErr) {
      console.error("Push notification error on status update:", pushErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// Download Invoice
const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("address");

    if (!order) {
      return res.status(404).send("<h1>Order not found</h1>");
    }

   
    if (order.user.toString() !== req.userId && req.role !== "admin") {
      return res.status(403).send("<h1>Access denied</h1>");
    }

   
    const allowedStatuses = ["Confirmed", "Packed", "Shipped", "Delivered"];
    if (!allowedStatuses.includes(order.orderStatus)) {
      return res.status(400).send("<h1>Invoice is only available for confirmed orders</h1>");
    }

    
    let customerEmail = "N/A";
    try {
      const token = req.query.token || req.headers.authorization?.split(" ")[1];
      if (token) {
        const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:5000";
        const isOwner = order.user.toString() === req.userId;
        const fetchUrl = isOwner 
          ? `${authUrl}/api/user/profile` 
          : `${authUrl}/api/user/find/${order.user}`;

        const authRes = await fetch(fetchUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const authData = await authRes.json();
        if (authData && authData.success && authData.user) {
          customerEmail = authData.user.email || customerEmail;
        }
      }
    } catch (authErr) {
      console.error("Error fetching user email for invoice:", authErr.message);
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${order._id}</title>
  <style>
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 40px;
      background-color: #f8fafc;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 50px;
      border-radius: 16px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 30px;
      margin-bottom: 30px;
    }
    .logo-section h2 {
      margin: 0;
      color: #0f172a;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .logo-section span {
      color: #4f46e5;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .invoice-title p {
      margin: 5px 0 0;
      color: #64748b;
      font-size: 14px;
      font-family: monospace;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    .info-block h3 {
      margin: 0 0 10px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }
    .info-block p {
      margin: 0 0 5px;
      font-size: 15px;
      line-height: 1.5;
    }
    .info-block strong {
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
    }
    th {
      background-color: #f8fafc;
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      padding: 12px 16px;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 16px;
      font-size: 15px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .text-right {
      text-align: right;
    }
    .totals-section {
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 300px;
      margin-bottom: 0;
    }
    .totals-table td {
      padding: 10px 0;
      border-bottom: none;
    }
    .totals-table tr.grand-total td {
      border-top: 2px solid #e2e8f0;
      padding-top: 15px;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }
    .btn-container {
      max-width: 800px;
      margin: 0 auto 20px;
      display: flex;
      justify-content: flex-end;
    }
    .print-btn {
      background-color: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
      transition: all 0.2s;
    }
    .print-btn:hover {
      background-color: #4338ca;
    }
    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .invoice-card {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .btn-container {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="btn-container">
    <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div class="logo-section">
        <h2>E-<span>Commerce</span></h2>
      </div>
      <div class="invoice-title">
        <h1>Invoice</h1>
        <p>Order ID: #${order._id.toString().toUpperCase()}</p>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-block">
        <h3>Billed To</h3>
        <p><strong>${order.address?.fullName || "Valued Customer"}</strong></p>
        <p>${order.address?.addressLine1 || ""}</p>
        <p>${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.postalCode || ""}</p>
        <p>Phone: ${order.address?.phone || "N/A"}</p>
        <p>Email: ${customerEmail}</p>
      </div>
      <div class="info-block" style="text-align: right;">
        <h3>Invoice Details</h3>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
        <p><strong>Status:</strong> ${order.orderStatus}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-right">Price</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr>
            <td>${item.product?.name || 'Product'}</td>
            <td class="text-right">₹${item.price.toFixed(2)}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">₹${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="totals-section">
      <table class="totals-table">
        <tbody>
          <tr>
            <td>Subtotal</td>
            <td class="text-right">₹${order.totalAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Shipping</td>
            <td class="text-right">₹0.00</td>
          </tr>
          <tr class="grand-total">
            <td>Grand Total</td>
            <td class="text-right">₹${order.totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
    `;

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(htmlContent);
  } catch (error) {
    console.error("Download Invoice Error:", error);
    return res.status(500).send("<h1>Internal Server Error</h1>");
  }
};

// Create Return/Refund/Replace Request
const createReturnRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { orderId, requestType, reason, items } = req.body;

    if (!orderId || !requestType || !reason) {
      return res.status(400).json({
        success: false,
        message: "Order ID, Request Type, and Reason are required.",
      });
    }

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Check if there is an existing pending return request for this order
    const existingRequest = await ReturnRequest.findOne({ order: orderId, status: "Pending" });
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "A pending return request already exists for this order.",
      });
    }

    // Populate items
    let requestItems = [];
    if (items && items.length > 0) {
      for (const item of items) {
        const orderItem = order.items.find(oi => oi.product.toString() === item.product);
        if (!orderItem) {
          return res.status(400).json({
            success: false,
            message: `Product ${item.product} is not part of this order.`,
          });
        }
        requestItems.push({
          product: item.product,
          quantity: item.quantity || orderItem.quantity,
          price: orderItem.price,
        });
      }
    } else {
      // Default to all items in the order
      requestItems = order.items.map(oi => ({
        product: oi.product,
        quantity: oi.quantity,
        price: oi.price,
      }));
    }

    const returnRequest = await ReturnRequest.create({
      order: orderId,
      user: userId,
      items: requestItems,
      requestType,
      reason,
      status: "Pending",
    });

    // If user cancelled pre-paid order, we update orderStatus to Cancelled
    if (requestType === "Refund" && order.orderStatus !== "Delivered" && order.paymentMethod === "Razorpay") {
      order.orderStatus = "Cancelled";
      await order.save();
      
      // Restore stock
      for (const item of order.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: `${requestType} request submitted successfully.`,
      data: returnRequest,
    });
  } catch (error) {
    console.error("Create Return Request Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};

// Get all return/refund requests (with filter option)
const getReturnRequests = async (req, res) => {
  try {
    let filter = {};

    if (req.role === "admin" || req.role === "subAdmin") {
      const { status, type } = req.query;
      if (status) filter.status = status;
      if (type) filter.requestType = type;
    } else {
      filter.user = req.userId;
    }

    const requests = await ReturnRequest.find(filter)
      .populate({
        path: "order",
        populate: {
          path: "address",
        },
      })
      .populate("items.product", "name price images")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Return requests fetched successfully.",
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Get Return Requests Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};

// Update Return request status (Sub-admin / Admin only)
const updateReturnRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const allowedStatus = ["Pending", "Processing", "Approved", "Rejected", "Completed"];
    if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value.",
      });
    }

    const request = await ReturnRequest.findById(id).populate("order");
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Return request not found.",
      });
    }

    if (status) {
      request.status = status;
    }
    if (adminNotes !== undefined) {
      request.adminNotes = adminNotes;
    }

    await request.save();

    // If approved or completed and request type is Refund, mark order as Refunded
    if ((status === "Completed" || status === "Approved") && request.requestType === "Refund") {
      const order = request.order;
      if (order) {
        order.paymentStatus = "Refunded";
        await order.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Return request status updated successfully.",
      data: request,
    });
  } catch (error) {
    console.error("Update Return Request Status Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};

export {
  createOrder,
  createOrderRazorpay,
  verifyRazorpay,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  downloadInvoice,
  createReturnRequest,
  getReturnRequests,
  updateReturnRequestStatus,
};
