import express from "express"
import auth from "../middleware/Auth.js";
import { createContact, getAllContacts, assignContactSupport, updateContactStatus } from "../controllers/Contact.js";

const contactRoute =express.Router();

contactRoute.post("/add",auth,createContact)
contactRoute.get("/get",auth,getAllContacts)
contactRoute.put("/assign/:id",auth,assignContactSupport)
contactRoute.put("/status/:id",auth,updateContactStatus)

export default contactRoute;