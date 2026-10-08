import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gen AI server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Import SQL Server database utility and API router
import { apiRouter } from './server/routes.ts';

// Mount all SQL Server API endpoints under /api
app.use('/api', apiRouter);

// AI Lead Summary Endpoint
app.post('/api/ai/lead-summary', async (req, res) => {
  try {
    const { lead, products, notes } = req.body;
    const prompt = `You are the lead intelligence assistant for Vartu Creations (a handmade arts and crafts business selling resin art, customized rakhis, scented candles, concrete items, crochet, and gift hampers).
Analyze this lead and return a concise, high-impact assessment.

Lead Data:
${JSON.stringify(lead, null, 2)}

Products of Interest:
${JSON.stringify(products, null, 2)}

Activity / Notes:
${JSON.stringify(notes, null, 2)}

Respond with structured JSON strictly in this format:
{
  "requirement": "Clear 1-sentence customer requirement summary",
  "buyingIntent": "High" | "Medium" | "Low",
  "estimatedBudget": "Estimated or indicated budget in INR",
  "urgency": "Urgent" | "Normal" | "Exploratory",
  "keyObjections": ["Objection 1", "Objection 2"],
  "currentStage": "Brief status description",
  "recommendedAction": "Concrete next step for Vartu sales team to close the deal",
  "whatsappDraft": "A warm, personal draft message ready to send on WhatsApp"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Lead summary error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate lead summary' });
  }
});

// AI Follow-up Message Generator
app.post('/api/ai/follow-up-message', async (req, res) => {
  try {
    const { channel, tone, objective, context } = req.body;
    const prompt = `You are a warm, customer-obsessed sales expert for Vartu Creations (artisan handmade resin crafts, customized gifts, scented candles, corporate hampers).
Generate a personalized follow-up message for a client.

Channel: ${channel} (e.g. WhatsApp, Instagram DM, Email)
Tone: ${tone} (e.g. Warm & Friendly, Professional, Urgent, Celebration/Festive)
Objective: ${objective} (e.g. Quotation follow-up, Advance payment reminder, Delivery feedback, Repeat order for festival)
Context Details:
${JSON.stringify(context, null, 2)}

Guidelines:
- Indian crafts context: warm, respectful, personalized.
- Mention specific product names and agreed deadlines if available.
- For WhatsApp / Instagram, include appropriate festive craft emojis (✨, 🪔, 🌸, 🎁) without spamming.
- Provide a clear, low-friction call-to-action (e.g. "Let me know if you'd like me to lock in your production slot today!").

Return JSON:
{
  "subject": "Subject line (if email, else null)",
  "message": "The complete ready-to-send message copy",
  "tip": "Short 1-sentence sales coaching tip"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Follow-up message error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate follow-up message' });
  }
});

// AI Product Recommender
app.post('/api/ai/recommend-products', async (req, res) => {
  try {
    const { customerNeed, budget, quantity, catalogue } = req.body;
    const prompt = `You are the product curator for Vartu Creations.
Recommend products exclusively from the provided catalogue that match the customer's request.
DO NOT fabricate items or prices not in the catalogue.

Customer Request: "${customerNeed}"
Budget per unit / total: "${budget || 'Flexible'}"
Target Quantity: "${quantity || 1}"

Catalogue Items:
${JSON.stringify(catalogue, null, 2)}

Return JSON:
{
  "recommendations": [
    {
      "productId": "id from catalogue",
      "productName": "name from catalogue",
      "suggestedPrice": 0,
      "reason": "Why this is suitable for this occasion and budget",
      "customizationIdea": "Artisan personalization idea (e.g. gold foil name, dried marigold petals, custom fragrance)"
    }
  ],
  "bundleSuggestion": "An artisan gift hamper combo idea if relevant",
  "curatorNote": "Short advice on margin and production feasibility"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Product recommendation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to recommend products' });
  }
});

// AI Delivery Risk & Production Analysis
app.post('/api/ai/delivery-risk-analysis', async (req, res) => {
  try {
    const { orders } = req.body;
    const prompt = `Analyze current active orders for Vartu Creations to detect potential bottleneck, resin curing delays, or shipping deadline risks.
Resin requires 24-48 hours curing time. Custom engravings or packaging take additional time.

Active Orders:
${JSON.stringify(orders, null, 2)}

Return JSON:
{
  "highRiskOrders": [
    {
      "orderNumber": "VC-ORD-XXXX",
      "riskLevel": "High" | "Medium" | "Low",
      "riskReason": "Concrete bottleneck reason",
      "suggestedRemedy": "Operational action (e.g. prioritize resin pour today, express courier via BlueDart)"
    }
  ],
  "productionAdvice": "Overall production batching advice to minimize craft waste and maximize throughput",
  "overallHealth": "Healthy" | "Attention Needed" | "Critical"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Risk analysis error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to analyze risk' });
  }
});

// AI Natural Language CRM & Sales Assistant
app.post('/api/ai/sales-assistant', async (req, res) => {
  try {
    const { query, crmSnapshot } = req.body;
    const prompt = `You are the executive AI Sales & Operations Co-pilot for Vartu Creations.
Answer the user's business query using ONLY the provided real CRM snapshot data.
Never fabricate numbers, sales, or customers. If data is not present, clearly state so.

User Question: "${query}"

Live CRM Snapshot:
${JSON.stringify(crmSnapshot, null, 2)}

Provide a concise, direct, helpful answer with key facts formatted cleanly with bold highlights and bullet points. Include actionable business advice where appropriate.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ success: true, answer: response.text });
  } catch (error: any) {
    console.error('Sales assistant error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to process inquiry' });
  }
});

// Mount Vite in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vartu Creations CRM running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
