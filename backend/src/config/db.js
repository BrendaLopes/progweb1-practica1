import mongoose from "mongoose";
import "dotenv/config";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Atlas conectado");
  } catch (err) {
    console.error("Error conectando a MongoDB:", err.message);
    process.exit(1);
  }
}
