import express from "express"
import auth from "../middleware/Auth.js";
import { addReview, getReviewsByProduct } from "../controllers/Review.js";

const reviewRoute = express.Router();

reviewRoute.post("/add",auth,addReview);
reviewRoute.get("/get/:productId",getReviewsByProduct)

export default reviewRoute;