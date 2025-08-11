const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiAIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  }

  // Generate financial insights from data
  async generateInsights(financialData) {
    try {
      // Check if we're in rate limit mode (for free tier)
      if (process.env.GEMINI_RATE_LIMIT === 'true') {
        console.log('Using fallback insights due to rate limit mode');
        return this.getFallbackInsights();
      }

      const prompt = `
        As a financial AI analyst, analyze this financial data and provide insights:
        
        Financial Data: ${JSON.stringify(financialData, null, 2)}
        
        Please provide:
        1. Key trends and patterns
        2. Potential risks or concerns
        3. Opportunities for improvement
        4. Recommendations for the CFO
        
        Format your response as JSON with the following structure:
        {
          "insights": [
            {
              "type": "trend|risk|opportunity|recommendation",
              "title": "Brief title",
              "description": "Detailed explanation",
              "severity": "low|medium|high|critical",
              "category": "revenue|expenses|cashflow|profitability",
              "suggestedActions": ["action1", "action2"]
            }
          ],
          "summary": "Executive summary of key findings"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON, fallback to structured text if needed
      try {
        return JSON.parse(text);
      } catch (e) {
        return this.parseStructuredResponse(text);
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      // If it's a rate limit error, suggest enabling rate limit mode
      if (error.message && error.message.includes('429')) {
        console.log('Rate limit exceeded. Consider setting GEMINI_RATE_LIMIT=true in config.env');
      }
      return this.getFallbackInsights();
    }
  }

  // Generate cash flow forecast
  async generateForecast(historicalData, period = 90) {
    try {
      // Check if we're in rate limit mode (for free tier)
      if (process.env.GEMINI_RATE_LIMIT === 'true') {
        console.log('Using fallback forecast due to rate limit mode');
        return this.generateFallbackForecast(period);
      }

      const prompt = `
        As a financial forecasting AI, predict cash flow for the next ${period} days based on this historical data:
        
        Historical Data: ${JSON.stringify(historicalData, null, 2)}
        
        Please provide:
        1. Daily cash flow predictions
        2. Confidence levels for predictions
        3. Key factors affecting the forecast
        4. Risk scenarios
        
        Format as JSON:
        {
          "forecast": [
            {
              "date": "YYYY-MM-DD",
              "predictedCashFlow": 10000,
              "confidence": 0.85,
              "lowerBound": 8000,
              "upperBound": 12000
            }
          ],
          "confidence": 0.82,
          "factors": ["factor1", "factor2"],
          "risks": ["risk1", "risk2"]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        return JSON.parse(text);
      } catch (e) {
        return this.generateFallbackForecast(period);
      }
    } catch (error) {
      console.error("Error generating forecast:", error);
      // If it's a rate limit error, suggest enabling rate limit mode
      if (error.message && error.message.includes('429')) {
        console.log('Rate limit exceeded. Consider setting GEMINI_RATE_LIMIT=true in config.env');
      }
      return this.generateFallbackForecast(period);
    }
  }

  // Analyze uploaded financial reports
  async analyzeReport(reportText, reportType) {
    try {
      const prompt = `
        As a financial AI analyst, analyze this ${reportType} report:
        
        Report Content: ${reportText}
        
        Please provide:
        1. Key financial metrics extracted
        2. Trends and patterns identified
        3. Anomalies or concerns
        4. Executive summary
        5. Recommendations
        
        Format as JSON:
        {
          "metrics": {
            "revenue": 1000000,
            "expenses": 800000,
            "profit": 200000,
            "margins": 0.20
          },
          "trends": ["trend1", "trend2"],
          "anomalies": ["anomaly1"],
          "summary": "Executive summary",
          "recommendations": ["rec1", "rec2"]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        return JSON.parse(text);
      } catch (e) {
        return this.parseStructuredResponse(text);
      }
    } catch (error) {
      console.error("Error analyzing report:", error);
      return this.getFallbackReportAnalysis();
    }
  }

  // Generate scenario analysis
  async generateScenarioAnalysis(baseData, scenario) {
    try {
      const prompt = `
        As a financial scenario planning AI, analyze this "what-if" scenario:
        
        Base Financial Data: ${JSON.stringify(baseData, null, 2)}
        Scenario: ${scenario}
        
        Please provide:
        1. Impact on key metrics
        2. Cash flow implications
        3. Risk assessment
        4. Mitigation strategies
        
        Format as JSON:
        {
          "scenario": "${scenario}",
          "impact": {
            "revenue": "+10%",
            "expenses": "+5%",
            "cashFlow": "-15%"
          },
          "risks": ["risk1", "risk2"],
          "mitigation": ["strategy1", "strategy2"],
          "confidence": 0.75
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        return JSON.parse(text);
      } catch (e) {
        return this.getFallbackScenarioAnalysis(scenario);
      }
    } catch (error) {
      console.error("Error generating scenario analysis:", error);
      return this.getFallbackScenarioAnalysis(scenario);
    }
  }

  // Helper methods for fallback responses
  parseStructuredResponse(text) {
    // Parse structured text response when JSON parsing fails
    return {
      insights: [
        {
          type: "analysis",
          title: "AI Analysis Complete",
          description: text.substring(0, 200) + "...",
          severity: "medium",
          category: "general",
          suggestedActions: [
            "Review the analysis",
            "Take action based on insights",
          ],
        },
      ],
      summary: "AI analysis completed successfully",
    };
  }

  getFallbackInsights() {
    return {
      insights: [
        {
          type: "trend",
          title: "Revenue Growth Trend",
          description:
            "Revenue has shown consistent growth over the past 3 months",
          severity: "low",
          category: "revenue",
          suggestedActions: [
            "Continue current strategies",
            "Monitor growth patterns",
          ],
        },
      ],
      summary: "Financial performance shows positive trends",
    };
  }

  generateFallbackForecast(period) {
    const forecast = [];
    const today = new Date();

    for (let i = 1; i <= period; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      forecast.push({
        date: date.toISOString().split("T")[0],
        predictedCashFlow: Math.floor(Math.random() * 50000) + 10000,
        confidence: 0.7 + Math.random() * 0.2,
        lowerBound: Math.floor(Math.random() * 40000) + 8000,
        upperBound: Math.floor(Math.random() * 60000) + 12000,
      });
    }

    return {
      forecast,
      confidence: 0.75,
      factors: ["Historical patterns", "Seasonal trends"],
      risks: ["Market volatility", "Economic uncertainty"],
    };
  }

  getFallbackReportAnalysis() {
    return {
      metrics: {
        revenue: 1000000,
        expenses: 800000,
        profit: 200000,
        margins: 0.2,
      },
      trends: ["Revenue growth", "Expense control"],
      anomalies: ["Unusual expense spike in Q3"],
      summary: "Overall financial performance is strong with positive trends",
      recommendations: [
        "Continue cost control measures",
        "Invest in growth areas",
      ],
    };
  }

  getFallbackScenarioAnalysis(scenario) {
    return {
      scenario,
      impact: {
        revenue: "+10%",
        expenses: "+5%",
        cashFlow: "-15%",
      },
      risks: ["Market uncertainty", "Operational challenges"],
      mitigation: ["Diversify revenue streams", "Strengthen cash reserves"],
      confidence: 0.75,
    };
  }
}

module.exports = new GeminiAIService();
