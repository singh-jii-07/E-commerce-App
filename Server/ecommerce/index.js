import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./App/config/db.js";
import router from "./App/routes/User.js";
import addressRoute from "./App/routes/Address.js";
import categoryRoutes from "./App/routes/Category.js";
import productRoute from "./App/routes/Product.js";
import cartRoute from "./App/routes/Cart.js";
import reviewRoute from "./App/routes/Review.js";
import orderRoute from "./App/routes/Order.js";
// import paymentRoute from "./App/routes/paymentRoutes.js";



dotenv.config();


const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/adminuser", router);
app.use("/api/address",addressRoute);
app.use("/api/Category",categoryRoutes);
app.use("/api/product",productRoute);
app.use("/api/cart",cartRoute);
app.use("/api/review",reviewRoute);
app.use("/api/order",orderRoute);
// app.use("/api/payment",paymentRoute);

app.get("/", (req, res) => {
  res.send("Welcome to Book Store API");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});