import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./App/config/db.js";
import router from "./App/routes/User.js";
import addressRoute from "./App/routes/Address.js";
import categoryRoutes from "./App/routes/Category.js";



dotenv.config();


const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/adminuser", router);
app.use("/api/address",addressRoute);
app.use("/api/Category",categoryRoutes)

app.get("/", (req, res) => {
  res.send("Welcome to Book Store API");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});