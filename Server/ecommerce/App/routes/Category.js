import express from 'express'
import auth from '../middleware/Auth.js';
import isadmin from '../middleware/isadmin.js';
import { addCategory, getCategories, deleteCategory } from '../controllers/Category.js';

const categoryRoutes= express.Router();

categoryRoutes.post("/add",auth,isadmin,addCategory)
categoryRoutes.get("/get", getCategories)
categoryRoutes.delete("/delete/:id", auth, isadmin, deleteCategory)

export default categoryRoutes