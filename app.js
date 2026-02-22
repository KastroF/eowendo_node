require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const userRoutes = require("./routes/User");
const commerceRoutes = require("./routes/Commerce");
const paiementRoutes = require("./routes/Paiement");
const reportingRoutes = require("./routes/Reporting");
const quartierRoutes = require("./routes/Quartier");
const marcheRoutes = require("./routes/Marche");
const typeTaxeRoutes = require("./routes/TypeTaxe");

const app = express();

// MongoDB connection
mongoose
  .connect(
    `mongodb+srv://communeowendo_db_user:${process.env.MONGOPASS}@cluster0.oa0ciap.mongodb.net/eowendo?retryWrites=true&w=majority&appName=Cluster0`,
    { autoIndex: true }
  )
  .then(() => console.log("MongoDB connecté"))
  .catch((err) => console.log("Erreur MongoDB:", err));

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/user", userRoutes);
app.use("/api/commerce", commerceRoutes);
app.use("/api/paiement", paiementRoutes);
app.use("/api/reporting", reportingRoutes);
app.use("/api/quartier", quartierRoutes);
app.use("/api/marche", marcheRoutes);
app.use("/api/typetaxe", typeTaxeRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", app: "eOwendo API", version: "1.0.0" });
});

module.exports = app;
