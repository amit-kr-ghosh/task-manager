const aiRoutes = require("express").Router();
const axios = require("axios");

aiRoutes.post("/autocomplete", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Text is required",
      });
    }

    const cleanText = text.trim();

    // Prevent unnecessarily large requests.
    if (cleanText.length > 5000) {
      return res.status(400).json({
        error: "Text is too long",
      });
    }

    const response = await axios.post(
      "https://api.cohere.com/v2/chat",
      {
        stream: false,
        model: "command-a-03-2025",
        max_tokens: 60,
        messages: [
          {
            role: "user",
            content: `Answer in max 30 words: ${cleanText}`,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        },
      },
    );

    const data = response.data;

    if (
      !data ||
      !data.message ||
      !data.message.content ||
      !data.message.content[0]
    ) {
      return res.status(502).json({
        error: "No response from AI",
      });
    }

    const suggestion = data.message.content[0].text;

    res.json({
      suggestion,
    });
  } catch (error) {
    console.error("Cohere error:", error.response?.data || error.message);

    res.status(500).json({
      error: "AI suggestion failed",
    });
  }
});

module.exports = aiRoutes;
