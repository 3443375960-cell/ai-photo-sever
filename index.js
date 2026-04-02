const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

app.post('/api/edit', async (req, res) => {
  try {
    const { image, beauty, white, face, body } = req.body;
    const prompt = `
请专业修图：
美颜强度${beauty}%，美白强度${white}%，瘦脸强度${face}%，瘦身强度${body}%
画质高清、不损伤、自然真实，只返回图片，不要文字。
`;
    const response = await axios.post(GEMINI_URL, {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/jpeg", data: image } }
        ]
      }]
    });
    const result = response.data.candidates[0].content.parts[0].inline_data.data;
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: "处理失败" });
  }
});

app.post('/api/remove', async (req, res) => {
  try {
    const { image } = req.body;
    const prompt = "去除杂物瑕疵，无痕修复，高清画质，只返回图片，不要文字";
    const response = await axios.post(GEMINI_URL, {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/jpeg", data: image } }
        ]
      }]
    });
    const result = response.data.candidates[0].content.parts[0].inline_data.data;
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: "去除失败" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("服务启动"));
