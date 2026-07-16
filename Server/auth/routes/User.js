import express from "express";
import { register,login, Logout, profile,forgotPassword,verifyOtp,resetPassword } from "../Controllers/User.js";
import auth from "../Middleware/Auth.js";

const userRoute = express.Router();

userRoute.post("/register", register);
userRoute.post("/login", login);
userRoute.post("/logout",auth,Logout)
userRoute.get("/profile",auth,profile)
userRoute.post('/forgot',forgotPassword)
userRoute.post('/otp',verifyOtp)
userRoute.post('/chnagepassword',resetPassword)

export default userRoute;
