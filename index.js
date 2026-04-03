// index.js - 核心后端服务
const express = require('express');
const cors = require('cors'); // 解决前端访问后端的网络报错问题
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// 🚨 开启跨域允许
app.use(cors());
// 🚨 设置最大接收50MB的文件，因为图片转成Base64后体积很大
app.use(express.json({ limit: '50mb' })); 

// 读取 Render 后台中配置的 API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 核心接口
app.post('/api/process-image', async (req, res) => {
    try {
        const { imageBase64, maskBase64, prompt, mode, sliderValue } = req.body;
        
        // 🚨 选用最新的多模态模型
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

        // 将前端传来的图片拆解，准备发给 Google
        const imageParts = [{
            inlineData: { data: imageBase64.split(',')[1], mimeType: "image/jpeg" }
        }];
        
        // 如果用户画了蒙版（用于消除、补发缝），一起发过去
        if (maskBase64) {
            imageParts.push({
                inlineData: { data: maskBase64.split(',')[1], mimeType: "image/png" }
            });
        }

        // --- 核心大脑：把App按钮和推杆的数值，翻译成 AI 听得懂的咒语(Prompt) ---
        let aiCommand = prompt || ""; 

        if (mode === 'brightness') {
            const level = sliderValue > 50 ? "increase" : "decrease";
            aiCommand = `Adjust the brightness and color of this image. ${level} it by ${Math.abs(sliderValue - 50)}%. Return ONLY the modified image.`;
        } else if (mode === 'beauty') {
            aiCommand = `Retouch the face naturally. Smooth the skin and remove blemishes. Intensity level: ${sliderValue} out of 100. DO NOT change facial features or makeup structure. Return ONLY the modified image.`;
        } else if (mode === 'liquify') {
            const action = sliderValue > 50 ? "slimmer" : "wider";
            aiCommand = `Liquify the face slightly to make it ${action}. Intensity level: ${Math.abs(sliderValue - 50)}%. Keep it realistic. Return ONLY the modified image.`;
        } else if (mode === 'remove') {
            aiCommand = `Remove the object in the masked area perfectly and fill the background seamlessly. Return ONLY the modified image.`;
        } else if (mode === 'hairline') {
            aiCommand = `Fill in the hair/hairline in the masked area. Match the original hair color and texture perfectly. Return ONLY the modified image.`;
        } else if (mode === 'fill') {
            aiCommand = `Fill the masked area based on this instruction: ${prompt}. Blend seamlessly with the surroundings. Return ONLY the modified image.`;
        }

        console.log(`[AI 任务开始] 模式: ${mode}, 指令: ${aiCommand}`);

        // 把指令和图片一起发给 Google 
        const result = await model.generateContent([aiCommand, ...imageParts]);
        const response = await result.response;
        const textResponse = response.text();
        
        // ⚠️ 高级程序员备注：目前 Gemini API 返回的是文本。
        // 如果它返回了 Base64 图片，通常会包含在返回结果中。
        // 等 Google 正式开放纯图像编辑 API 时，这里的提取逻辑可能需要微调。
        // 假设当前 AI 返回的纯文本就是 Base64 编码：
        let outputImageBase64 = textResponse.trim();
        // 如果返回的不是 data:image 开头，我们帮它加上前缀
        if (!outputImageBase64.startsWith('data:image')) {
            outputImageBase64 = `data:image/jpeg;base64,${outputImageBase64}`;
        }

        // 把处理好的图片发回给你的 App
        res.json({ success: true, image: outputImageBase64 });
    } catch (error) {
        console.error("[处理失败]:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 监听 Render 分配的端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 后端服务器已启动，监听端口: ${PORT}`));
