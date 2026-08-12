import express from "express";
import { getAllUsers, getUserById, updatePushToken } from "../controllers/User.js";
import auth from "../middleware/Auth.js";
import admin from '../middleware/isadmin.js';

const router = express.Router();

router.get("/getuser", auth, admin, getAllUsers);
router.get("/getUserById/:id", auth, admin, getUserById);
router.post("/push-token", auth, updatePushToken);

export default router;