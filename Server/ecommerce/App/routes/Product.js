import express from "express"
import auth from "../middleware/Auth.js";
import isadmin from "../middleware/isadmin.js"
import { addProduct, deleteProduct, getProduct, getProductById, updateProduct } from "../controllers/Product.js";


const productRoute= express.Router();

productRoute.post("/add",auth,isadmin,addProduct);
productRoute.get("/get",getProduct);
productRoute.get("/get/:id",getProductById)

productRoute.put("/update/:id",auth,isadmin,updateProduct)

productRoute.delete("/delete/:id",auth,isadmin,deleteProduct)

export default productRoute;