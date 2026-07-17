import express from "express";
import { getAllUsers, getUserById } from "../controllers/User.js";
import auth from "../middleware/Auth.js";
import admin from '../middleware/Isadmin.js'

const router = express.Router();

router.get("/getuser", auth, admin, getAllUsers);

router.get("/getUserById/:id", auth, admin, getUserById);

export default router;