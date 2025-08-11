const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: "./config.env" });

const aiRoutes = require("./routes/ai");
const financialRoutes = require("./routes/financial");
const authRoutes = require("./routes/auth");
const dataCleanupRoutes = require("./routes/data-cleanup");
const budgetVarianceRoutes = require("./routes/budget-variance");
const reportsRoutes = require("./routes/reports");
const insightsRoutes = require("./routes/insights");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/ai", aiRoutes);
app.use("/api/financial", financialRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cleanup", dataCleanupRoutes);
app.use("/api/budget-variance", budgetVarianceRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/insights", insightsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "AI CFO Assistant Backend Running" });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../build", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 AI CFO Assistant Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
