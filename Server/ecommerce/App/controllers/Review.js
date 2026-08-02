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

    // Fetch user details from auth service
    let userName = "Verified Customer";
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:5000";
        const authRes = await fetch(`${authUrl}/api/user/find/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const authData = await authRes.json();
        if (authData && authData.success && authData.user) {
          userName = authData.user.name || userName;
        }
      }
    } catch (authErr) {
      console.error("Error fetching user name for review:", authErr.message);
    }

    const review = await Review.create({
      user: userId,
      userName,
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
      .sort({ createdAt: -1 });

    const formattedReviews = reviews.map(rev => {
      const obj = rev.toObject();
      return {
        ...obj,
        user: {
          name: obj.userName || "Verified Customer"
        }
      };
    });

    return res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      count: formattedReviews.length,
      data: formattedReviews,
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