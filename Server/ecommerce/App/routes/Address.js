import express from "express"
import { addAddress } from "../controllers/Address.js";

const addressRoute = express.Router();

addressRoute.post("/add",addAddress)

export default addressRoute;