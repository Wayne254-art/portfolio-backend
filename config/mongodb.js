const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

async function connectMongo() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connection established");
    } catch (err) {
        console.error("❌ Error connecting to MongoDB:", err.message);
    }
}

module.exports = connectMongo;
