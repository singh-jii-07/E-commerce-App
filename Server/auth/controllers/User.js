import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js"
const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const userExisting = await User.findOne({ email });
    if (userExisting) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);


    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (err) {
    console.error("REGISTER ERROR ", err);

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export { register };