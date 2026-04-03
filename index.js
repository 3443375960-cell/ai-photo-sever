const express = require('express');
const axios = require('axios');
const app = express();

// 1. 解决跨域问题（前端APP调用必须加）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 2. 增大请求体限制（处理大图片base64，避免413错误）
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 3. Google Gemini API Key（替换为你自己的！）
const GEMINI_API_KEY = "AIzaSyBDMH_z8bPYwODJ9GfPgYfscBnAMKeXm1g";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// 4. API转发接口（补充完整错误处理）
app.post('/api/gemini', async (req, res) => {
  try {
    const { image, prompt, mask, type } = req.body;
    
    // 入参校验（避免空请求报错）
    if (!image || !prompt) {
      return res.status(400).json({ error: "缺少必要参数：image 或 prompt" });
    }

    const response = await axios.post(GEMINI_API_URL, {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/jpeg", data: image } }
        ]
      }],
      generationConfig: {
        response_mime_type: "image/jpeg",
        temperature: 0.7,
        maxOutputTokens: 8192
      }
    }, {
      timeout: 30000 // 30秒超时，避免Render自动断开
    });

    // 校验Gemini返回结果
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data) {
      return res.status(500).json({ error: "Gemini API返回数据异常" });
    }

    // 返回AI处理后的图片
    res.json({
      resultImage: response.data.candidates[0].content.parts[0].inline_data.data,
      success: true
    });

  } catch (error) {
    console.error("API请求错误:", error.message);
    res.status(500).json({
      error: "服务器处理失败",
      details: error.message
    });
  }
});

// 5. 健康检查接口（Render自动检测服务状态，避免误杀）
app.get('/health', (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// 6. 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 服务启动成功，运行在端口 ${PORT}`);
  console.log(`🔗 健康检查地址: http://localhost:${PORT}/health`);
});
