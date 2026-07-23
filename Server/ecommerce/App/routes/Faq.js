import express from "express"
import { createFaq, getFaqs } from "../controllers/Faq.js"
import auth from "../middleware/Auth.js"
import isadmin from "../middleware/isadmin.js"

const faqRoutes=express.Router()

faqRoutes.post("/add",auth,isadmin,createFaq);
faqRoutes.get("/get",auth,getFaqs)

export default faqRoutes