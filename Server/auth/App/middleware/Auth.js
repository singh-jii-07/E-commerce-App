import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({
        message: "Authorization token is missing or invalid",
      });
    }

    
    const token = authHeader.split(" ")[1];

    
    const decode = jwt.verify(token, process.env.JWT_SECRET);


    const user = await User.findById(decode.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    
    req.userId = user._id;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

export default auth;
