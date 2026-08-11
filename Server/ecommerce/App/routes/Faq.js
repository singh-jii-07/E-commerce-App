import express from "express"
import { createFaq, getFaqs, updateFaq, deleteFaq } from "../controllers/Faq.js"
import auth from "../middleware/Auth.js"
import isadmin from "../middleware/isadmin.js"

const faqRoutes=express.Router()

faqRoutes.post("/add",auth,isadmin,createFaq);
faqRoutes.get("/get",auth,getFaqs);
faqRoutes.put("/update/:id",auth,isadmin,updateFaq);
faqRoutes.delete("/delete/:id",auth,isadmin,deleteFaq);

export default faqRoutes