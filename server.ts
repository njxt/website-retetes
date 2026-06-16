import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini safely, using the recommended User-Agent and key binding
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } else {
    console.warn("WARN: GEMINI_API_KEY is not defined in the environment.");
  }
} catch (e) {
  console.error("Error initializing GoogleGenAI client:", e);
}

// REST API for intelligent recipe generation with Gemini AI
app.post("/api/gemini/generate-recipe", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Proprietatea 'prompt' este obligatorie." });
  }

  if (!ai) {
    return res.status(503).json({
      error: "Serviciul de Inteligență Artificială nu este configurat. Vă rugăm să configurați cheia GEMINI_API_KEY în panoul Settings > Secrets.",
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Gândește o rețetă culinară pe baza următoarei solicitări în limba română: "${prompt}".
Asigură-te că toate textele generate (titlu, descriere, ingrediente, mod de preparare) sunt în limba română cu diacritice, scrise cu mult gust și bun simț estetic (elegant, minimalist).
Dificultatea trebuie să fie exact una dintre: "ușor", "mediu", "dificil".
Categoria trebuie să fie exact una dintre: "Mic Dejun", "Prânz", "Cină", "Desert", "Gustări".
Ingredientele trebuie să fie exprimate logic cu cantități/unități (ex: "200g făină", "1/2 linguriță scorțișoară").
Modul de preparare trebuie descris ca pași individuali detaliați și clari.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Titlul elegant și corect gramatical al rețetei în limba română.",
            },
            description: {
              type: Type.STRING,
              description: "O descriere pasionantă de 1-2 fraze despre gustul și aspectul preparatului.",
            },
            category: {
              type: Type.STRING,
              description: "Categoria ideală a rețetei: Mic Dejun, Prânz, Cină, Desert sau Gustări.",
            },
            prepTime: {
              type: Type.INTEGER,
              description: "Timpul aproximativ de pregătire a ingredientelor în minute.",
            },
            cookTime: {
              type: Type.INTEGER,
              description: "Timpul aproximativ de gătire propriu-zisă în minute.",
            },
            servings: {
              type: Type.INTEGER,
              description: "Numărul implicit de porții pentru care sunt calculate ingredientele.",
            },
            difficulty: {
              type: Type.STRING,
              description: "Nivelul de dificultate: ușor, mediu sau dificil.",
            },
            calories: {
              type: Type.INTEGER,
              description: "Numărul estimativ de calorii pe porție (kcal), valoare numerică clară.",
            },
            protein: {
              type: Type.INTEGER,
              description: "Cantitatea estimativă de proteine pe porție în grame (valoare numerică întreagă).",
            },
            carbs: {
              type: Type.INTEGER,
              description: "Cantitatea estimativă de carbohidrați pe porție în grame (valoare numerică întreagă).",
            },
            fat: {
              type: Type.INTEGER,
              description: "Cantitatea estimativă de grăsimi pe porție în grame (valoare numerică întreagă).",
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "Lista completă de ingrediente necesare (ex: '2 ouă bio proaspete').",
            },
            instructions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "Etapele detaliate de preparare, scrise la persoana a II-a plural sau impersonal.",
            },
          },
          required: [
            "title",
            "description",
            "category",
            "prepTime",
            "cookTime",
            "servings",
            "difficulty",
            "calories",
            "protein",
            "carbs",
            "fat",
            "ingredients",
            "instructions",
          ],
        },
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("Răspunsul primit de la Gemini AI este gol.");
    }

    const recipeData = JSON.parse(textResponse.trim());
    return res.json(recipeData);
  } catch (error: any) {
    console.error("Eroare la generarea rețetei cu Gemini:", error);
    return res.status(500).json({
      error: `Nu s-a putut genera rețeta. Motiv: ${error.message || "Eroare internă server AI"}`,
    });
  }
});

// Setup Vite & Static Assets serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve HTML fallback for SPAs in production (Express v4 format)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bespoke Culinary Studio Server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer();
