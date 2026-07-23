import express from "express"
import { createContact, getAllContacts } from "../controllers/Contact.js";
import auth from "../middleware/Auth.js";
import isadmin from "../middleware/isadmin.js"

const contactRoute =express.Router();

contactRoute.post("/add",auth,createContact)
contactRoute.get("/get",auth,isadmin,getAllContacts)

export default contactRoute;