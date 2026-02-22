require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

async function seed() {
  await mongoose.connect(
    `mongodb+srv://communeowendo_db_user:${process.env.MONGOPASS}@cluster0.oa0ciap.mongodb.net/eowendo?retryWrites=true&w=majority&appName=Cluster0`
  );

  console.log("MongoDB connecté");

  // Check if admin exists
  const existing = await User.findOne({ userId: "admin" });
  if (existing) {
    console.log("Admin existe déjà, skip.");
  } else {
    const hashedPassword = await bcrypt.hash("admin", 10);
    await User.create({
      nom: "Admin Owendo",
      userId: "admin",
      password: hashedPassword,
      telephone: "077 00 00 00",
      role: "admin",
      arrondissement: "1er Arrondissement",
    });
    console.log("Admin créé: userId=admin, password=admin");
  }

  await mongoose.disconnect();
  console.log("Seed terminé.");
}

seed().catch(console.error);
