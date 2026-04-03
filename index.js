const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json({limit: '10mb'}));

// Google Gemini API Key（从Google AI Studio复制）
const GEMINI_API_KEY = "YOUR_GOOGLE_AI_STUDIO_API_KEY";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// API转发接口
app.post('/api/gemini', async (req, res) => {
  try {
    const { image, prompt, mask, type } = req.body;
    const response = await axios.post(GEMINI_API_URL, {
      contents: [{
        parts: [
          {text: prompt},
          {inline_data: {mime_type: "image/jpeg", data: image}}
        ]
      }],
      generationConfig: {response_mime_type: "image/jpeg"}
    });
    
    // 返回AI处理后的图片
    res.json({resultImage: response.data.candidates[0].content.parts[0].inline_data.data});
  } catch (error) {
    res.status(500).json({error: "请求失败"});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`服务运行在端口 ${PORT}`));
