import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./App/config/db.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();



app.get("/", (req, res) => {
  res.send("Welcome to Book Store API");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});