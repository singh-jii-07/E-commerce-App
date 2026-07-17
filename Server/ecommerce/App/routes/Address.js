import express from "express";
import {
  addAddress,
  getAddressById,
  getMyAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/Address.js";
import auth from "../middleware/Auth.js";

const addressRoute = express.Router();

addressRoute.post("/add", auth, addAddress);
addressRoute.get("/get", auth, getMyAddresses);
addressRoute.get("/get/:id", auth, getAddressById);
addressRoute.put("/update/:id", auth, updateAddress);
addressRoute.delete("/delete/:id", auth, deleteAddress);
addressRoute.patch("/default/:id", auth, setDefaultAddress);

export default addressRoute;
