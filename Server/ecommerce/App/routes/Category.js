import express from 'express'
import auth from '../middleware/Auth.js';
import isadmin from '../middleware/isadmin.js';
import { addCategory } from '../controllers/Category.js';

const categoryRoutes= express.Router();

categoryRoutes.post("/add",auth,isadmin,addCategory)

export default categoryRoutes