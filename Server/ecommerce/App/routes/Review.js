import express from "express"
import auth from "../middleware/Auth.js";
import { addReview, getReviewsByProduct, updateReview } from "../controllers/Review.js";

const reviewRoute = express.Router();

reviewRoute.post("/add",auth,addReview);
reviewRoute.get("/get/:productId",getReviewsByProduct)
reviewRoute.put("/update/:id",auth,updateReview);

export default reviewRoute;