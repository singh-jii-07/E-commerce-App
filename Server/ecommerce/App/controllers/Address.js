import Address from "../models/Address.js";

const addAddress = async (req, res) => {
  try {
    console.log("===== ADD ADDRESS =====");
    console.log("User ID:", req.userId);
    console.log("Role:", req.role);
    console.log("Body:", req.body);

    const authUserId = req.userId;

    if (!authUserId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found. Please login again.",
      });
    }

    const {
      fullName,
      phone,
      alternatePhone,
      addressLine1,
      landmark,
      city,
      state,
      country,
      postalCode,
      addressType,
    } = req.body;

    const addressCount = await Address.countDocuments({ authUserId });

    const address = await Address.create({
      authUserId,
      fullName,
      phone,
      alternatePhone,
      addressLine1,
      landmark,
      city,
      state,
      country,
      postalCode,
      addressType,
      isDefault: addressCount === 0,
    });
console.log("User ID:", req.userId);
    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      address,
    });

  } catch (error) {
    console.error("ADD ADDRESS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export { addAddress };