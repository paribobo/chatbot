import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import { createRequire } from 'module';
const require = createRequire(process.cwd() + '/');
const pdf = require("pdf-parse");
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // API routes
  app.get("/api/files", async (req, res) => {
    try {
      const auth = new google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });
      const drive = google.drive({ version: "v3", auth });
      const response = await drive.files.list({
        q: "mimeType = 'application/pdf'",
        fields: "files(id, name)",
      });
      res.json(response.data.files);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to list files" });
    }
  });

  app.get("/api/file/:id/content", async (req, res) => {
    try {
      const auth = new google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });
      const drive = google.drive({ version: "v3", auth });
      const response = await drive.files.get(
        { fileId: req.params.id, alt: "media" },
        { responseType: "arraybuffer" }
      );
      const data = Buffer.from(response.data as ArrayBuffer);
      const pdfData = await pdf(data);
      res.json({ text: pdfData.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to read file" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, documentText } = req.body;
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Answer the following question based on the provided document. If the answer is not in the document, say so.\n\nDocument:\n${documentText}\n\nQuestion:\n${prompt}`,
      });
      res.json({ response: result.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to chat" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
