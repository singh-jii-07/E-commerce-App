import Category from "../models/Category.js";

export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    
    const existingCategory = await Category.findOne({
      name: name.trim(),
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    
    const category = await Category.create({
      name: name.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Add Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};