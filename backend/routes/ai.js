const express = require("express");
const router = express.Router();
const geminiAI = require("../services/geminiAI");

// Generate AI insights from financial data
router.post("/generate-insights", async (req, res) => {
  try {
    const { financialData } = req.body;

    if (!financialData) {
      return res.status(400).json({
        error: "Financial data is required",
      });
    }

    console.log("🤖 Generating AI insights...");
    const insights = await geminiAI.generateInsights(financialData);

    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({
      error: "Failed to generate insights",
      details: error.message,
    });
  }
});

// Generate cash flow forecast
router.post("/forecast-cashflow", async (req, res) => {
  try {
    const { historicalData, period = 90 } = req.body;

    if (!historicalData) {
      return res.status(400).json({
        error: "Historical data is required",
      });
    }

    console.log(`🔮 Generating ${period}-day cash flow forecast...`);
    const forecast = await geminiAI.generateForecast(historicalData, period);

    res.json({
      success: true,
      data: forecast,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating forecast:", error);
    res.status(500).json({
      error: "Failed to generate forecast",
      details: error.message,
    });
  }
});

// Analyze uploaded financial reports
router.post("/analyze-report", async (req, res) => {
  try {
    const { reportText, reportType } = req.body;

    if (!reportText || !reportType) {
      return res.status(400).json({
        error: "Report text and type are required",
      });
    }

    console.log(`📊 Analyzing ${reportType} report...`);
    const analysis = await geminiAI.analyzeReport(reportText, reportType);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error analyzing report:", error);
    res.status(500).json({
      error: "Failed to analyze report",
      details: error.message,
    });
  }
});

// Generate scenario analysis
router.post("/scenario-analysis", async (req, res) => {
  try {
    const { baseData, scenario } = req.body;

    if (!baseData || !scenario) {
      return res.status(400).json({
        error: "Base data and scenario are required",
      });
    }

    console.log(`🎯 Generating scenario analysis: ${scenario}`);
    const analysis = await geminiAI.generateScenarioAnalysis(
      baseData,
      scenario
    );

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating scenario analysis:", error);
    res.status(500).json({
      error: "Failed to generate scenario analysis",
      details: error.message,
    });
  }
});

// Generate executive summary
router.post("/executive-summary", async (req, res) => {
  try {
    const { financialData, period = "monthly" } = req.body;

    if (!financialData) {
      return res.status(400).json({
        error: "Financial data is required",
      });
    }

    console.log(`📋 Generating ${period} executive summary...`);

    // Use the insights generation with executive summary focus
    const insights = await geminiAI.generateInsights(financialData);

    const summary = {
      period,
      summary: insights.summary || "Financial performance analysis completed",
      keyMetrics: financialData.metrics || {},
      insights: insights.insights || [],
      generatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating executive summary:", error);
    res.status(500).json({
      error: "Failed to generate executive summary",
      details: error.message,
    });
  }
});

// Health check for AI service
router.get("/health", async (req, res) => {
  try {
    // Test AI service with a simple prompt
    const testData = { revenue: 100000, expenses: 80000 };
    const testInsights = await geminiAI.generateInsights(testData);

    res.json({
      status: "OK",
      service: "Gemini AI",
      message: "AI service is operational",
      testResult: testInsights ? "Success" : "Failed",
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      service: "Gemini AI",
      message: "AI service is not operational",
      error: error.message,
    });
  }
});

module.exports = router;
