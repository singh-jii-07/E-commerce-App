import express from "express"
import { addToCart, deleteCartItem, getMyCart, updateCartItem } from "../controllers/Cart.js";
import auth from "../middleware/Auth.js"

const cartRoute =express.Router();

cartRoute.post("/add",auth,addToCart);
cartRoute.get("/get",auth,getMyCart);
cartRoute.delete("/delete/:id",auth,deleteCartItem)
cartRoute.put("/update/:id",auth,updateCartItem)

export default cartRoute