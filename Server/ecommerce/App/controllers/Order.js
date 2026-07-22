import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Address from "../models/Address.js";
import Product from "../models/Product.js";
import Razorpay from "razorpay";

let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Create order by Cash on Delivery (COD) or standard checkout
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

    // Deduct stock for ordered products
    for (const cartItem of cartItems) {
      await Product.findByIdAndUpdate(cartItem.product._id, {
        $inc: { stock: -cartItem.quantity },
      });
    }

    // Clear user cart
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

    // If paying for an existing order
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

    // Creating a new order from cart with Razorpay
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

    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: order._id.toString(),
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    // Deduct stock for ordered products
    for (const cartItem of cartItems) {
      await Product.findByIdAndUpdate(cartItem.product._id, {
        $inc: { stock: -cartItem.quantity },
      });
    }

    // Clear user cart
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID is required.",
      });
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for given Razorpay order ID.",
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

    // Admin can access any order, user can only access their own
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

    // Restore stock for cancelled items
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
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
      .populate("user", "name email phone")
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

    // Restore stock if admin sets status to Cancelled
    if (orderStatus === "Cancelled") {
      for (const item of order.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

    order.orderStatus = orderStatus;
    await order.save();

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

export {
  createOrder,
  createOrderRazorpay,
  verifyRazorpay,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};
