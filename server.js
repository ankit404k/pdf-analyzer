import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pdfParse = require('pdf-parse');
const { Configuration, OpenAIApi } = require('openai');
const axios = require('axios');
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// PDF Upload and Processing Endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { file } = req.body;

    // Validate file
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Parse PDF
    const pdfData = await pdfParse(Buffer.from(file, 'base64'));
    const text = pdfData.text;

    // AI Analysis
    const analysis = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Analyze the following business document. Extract key insights, summarize findings, and identify emerging trends. Highlight market positioning, strengths, weaknesses, and business opportunities.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Extract entities
    const entities = extractEntities(analysis.data.choices[0].message.content);

    res.json({
      id: uuidv4(),
      summary: analysis.data.choices[0].message.content,
      entities
    });
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// Entity recognition function
function extractEntities(text) {
  const entities = [];
  const entityRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
  const matches = text.match(entityRegex);
  if (matches) {
    entities.push(...matches);
  }
  return entities;
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const response = await axios.post('http://localhost:5000/api/analyze', {
  file: 'base64'
});