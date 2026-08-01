import mongoose from "mongoose";
import User from "../models/User.js";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DBURI);
        console.log(" MongoDB Connected Successfully");
        
        // Migrate existing users who do not have the isVerified field to be true
        await User.updateMany(
            { isVerified: { $exists: false } },
            { $set: { isVerified: true } }
        );
        console.log(" Database migration: Existing users marked as verified.");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};
export default connectDB;