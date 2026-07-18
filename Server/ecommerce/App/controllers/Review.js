import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";

 const addReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { product, rating, comment } = req.body;

    if (!product || !rating) {
      return res.status(400).json({
        success: false,
        message: "Product and rating are required",
      });
    }

  
    if (!mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID",
      });
    }

   
    const existingProduct = await Product.findById(product);

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

   
    const existingReview = await Review.findOne({
      user: userId,
      product,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    
    const review = await Review.create({
      user: userId,
      product,
      rating,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: review,
    });
  } catch (error) {
    console.error("ADD REVIEW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

 const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID",
      });
    }

    const reviews = await Review.find({
      product: productId,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("GET REVIEW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export {addReview, getReviewsByProduct}