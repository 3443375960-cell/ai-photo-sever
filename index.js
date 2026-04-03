const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const app = express();
app.use(express.json({limit: '50mb'}));

// 配置API Key（Google AI Studio）
const GEMINI_API_KEY = "你的Google AI Studio API Key";
const BANANA_API_KEY = "你的Banana API Key";

// Gemini初始化
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-vision" });

// AI处理接口
app.post('/api/process', async (req, res) => {
  try {
    const { func, prompt, image, rect, opacity } = req.body;
    let resultImage = '';

    switch(func) {
      // 物体移除（Gemini）
      case 'remove':
        const removeRes = await model.generateContent([
          prompt || "移除框选区域物体，保持背景自然融合",
          { inlineData: { data: image.split(',')[1], mimeType: "image/png" } }
        ]);
        resultImage = removeRes.response.text();
        break;

      // AI一键美颜（Gemini）
      case 'autoBeauty':
        const beautyRes = await model.generateContent([
          `自然美颜，保留五官妆容，透明度${opacity}%，优化皮肤、法令纹、光影`,
          { inlineData: { data: image.split(',')[1], mimeType: "image/png" } }
        ]);
        resultImage = beautyRes.response.text();
        break;

      // 补发缝（Gemini）
      case 'hair':
        const hairRes = await model.generateContent([
          "修复涂抹区域的发缝，自然衔接头发",
          { inlineData: { data: image.split(',')[1], mimeType: "image/png" } }
        ]);
        resultImage = hairRes.response.text();
        break;

      // Banana生成填充
      case 'generate':
        const bananaRes = await axios.post('https://api.banana.dev/run', {
          apiKey: BANANA_API_KEY,
          modelKey: "image-generation",
          inputs: { image, prompt, mask: rect }
        });
        resultImage = bananaRes.data.output;
        break;
    }

    res.json({ result: resultImage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
