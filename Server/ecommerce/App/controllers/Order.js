import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Address from "../models/Address.js";
import mongoose from "mongoose";

const createOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { address, paymentMethod } = req.body;

    if (!address || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Address and payment method are required.",
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

    if (cartItems.length === 0) {
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
          message: "Product not found.",
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
          message: `Only ${product.stock} ${product.unit} of ${product.name} available.`,
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
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const orders = await Order.find({ user: userId })
      .populate("items.product", "name price images")
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

const getOrderById = async (req, res) => {
  try {
    const { id} = req.params;

    const order = await Order.findOne({
      _id: id,
      user: req.userId,
    })
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
      Packed: ["Shipped"],
      Shipped: ["Delivered"],
      Delivered: [],
      Cancelled: [],
    };

    if (!statusFlow[order.orderStatus].includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be changed from ${order.orderStatus} to ${orderStatus}.`,
      });
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

export { createOrder, getMyOrders, getOrderById ,cancelOrder,getAllOrders,updateOrderStatus };
