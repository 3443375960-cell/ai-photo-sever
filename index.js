const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json({ limit: '20mb' }));

const GEMINI_API_KEY = "AIzaSyBDMH_z8bPYwODJ9GfPgYfscBnAMKeXm1g";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

app.post('/api/gemini', async (req, res) => {
    try {
        const { image, prompt, mask } = req.body;
        const response = await axios.post(GEMINI_URL, {
            contents: [{
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: "image/jpeg", data: image } }
                ]
            }],
            generationConfig: {
                response_mime_type: "image/jpeg"
            }
        });
        const img = response.data.candidates[0].content.parts[0].inline_data.data;
        res.json({ resultImage: img });
    } catch (err) {
        res.status(500).json({ error: "AI处理失败" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {});
