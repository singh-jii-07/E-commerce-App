import Address from "../models/Address.js";
import mongoose from "mongoose";

const addAddress = async (req, res) => {
  try {

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


const getMyAddresses = async (req, res) => {
  try {
    const authUserId = req.userId;

    const addresses = await Address.find({ authUserId }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      count: addresses.length,
      addresses,
    });
  } catch (error) {
    console.error("GET MY ADDRESSES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getAddressById = async (req, res) => {
  try {
    const authUserId = req.userId;
    const { id } = req.params;

   
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

   
    const address = await Address.findOne({
      _id: id,
      authUserId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address fetched successfully",
      address,
    });
  } catch (error) {
    console.error("GET ADDRESS BY ID ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const updateAddress = async (req, res) => {
  try {
    const authUserId = req.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    const address = await Address.findOne({
      _id: id,
      authUserId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    console.error("UPDATE ADDRESS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const authUserId = req.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    const address = await Address.findOne({
      _id: id,
      authUserId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await Address.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ADDRESS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const setDefaultAddress = async (req, res) => {
  try {
    const authUserId = req.userId;
    const { id } = req.params;

    // Check login
    if (!authUserId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    // Check address belongs to logged-in user
    const address = await Address.findOne({
      _id: id,
      authUserId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Remove previous default
    await Address.updateMany(
      { authUserId },
      {
        $set: {
          isDefault: false,
        },
      }
    );

    // Set new default
    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      address,
    });
  } catch (error) {
    console.error("SET DEFAULT ADDRESS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


export { addAddress,getMyAddresses,getAddressById,updateAddress,deleteAddress,setDefaultAddress };