import express from "express";
import {
  addProduct,
  getProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/Product.js";
import auth from "../middleware/Auth.js";
import isadmin from "../middleware/isadmin.js";

const productRoute = express.Router();

productRoute.post("/add", auth, isadmin, addProduct);
productRoute.get("/get", getProduct);
productRoute.get("/get/:id", getProductById);
productRoute.get("/getbyid/:id", getProductById);
productRoute.put("/update/:id", auth, isadmin, updateProduct);
productRoute.delete("/delete/:id", auth, isadmin, deleteProduct);

export default productRoute;
