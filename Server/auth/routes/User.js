import express from "express";
import { register,login, Logout } from "../Controllers/User.js";
import auth from "../Middleware/Auth.js";

const userRoute = express.Router();

userRoute.post("/register", register);
userRoute.post("/login", login);
userRoute.post("/logout",auth,Logout)

export default userRoute;
