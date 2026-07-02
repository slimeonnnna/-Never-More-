
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { Mistral } from '@mistralai/mistralai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mistral Proxy Route
  app.post('/api/chat', async (req, res) => {
    try {
      const { systemPrompt, userMessage, history, tools, apiKey, model } = req.body;
      
      const finalApiKey = apiKey || process.env.VITE_MISTRAL_API_KEY;
      
      if (!finalApiKey) {
        return res.status(400).json({ error: '未配置 API Key' });
      }

      const client = new Mistral({ apiKey: finalApiKey });
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history
      ];

      if (userMessage && (!history.length || history[history.length - 1]?.content !== userMessage)) {
        messages.push({ role: 'user', content: userMessage });
      }

      const chatResponse = await client.chat.complete({
        model: model || 'mistral-small-latest',
        messages: messages as any,
        tools: tools as any,
        toolChoice: tools && tools.length > 0 ? 'auto' : 'none',
      });

      res.json(chatResponse.choices?.[0]?.message);
    } catch (error: any) {
      console.error('Server Chat Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
