import express from "express";
import { register,login, Logout, profile,forgotPassword,verifyOtp,resetPassword, adminGetAllUsers, adminGetUserById } from "../controllers/User.js";
import auth from "../middleware/Auth.js";
import admin from "../middleware/Isadmin.js";

const userRoute = express.Router();

userRoute.post("/register", register);
userRoute.post("/login", login);
userRoute.post("/logout",auth,Logout)
userRoute.get("/profile",auth,profile)
userRoute.post('/forgot',forgotPassword)
userRoute.post('/otp',verifyOtp)
userRoute.post('/changepassword',resetPassword)


userRoute.get("/all", auth, admin, adminGetAllUsers);
userRoute.get("/find/:id", auth, admin, adminGetUserById);

export default userRoute;
