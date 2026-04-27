import { config } from "dotenv";
import path from "path";

// Load .env explicitly
config({ path: path.resolve(process.cwd(), ".env") });

console.log("Environment Keys Check:");
console.log("GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
console.log("OPENROUTER_API_KEY exists:", !!process.env.OPENROUTER_API_KEY);

if (process.env.GROQ_API_KEY) {
  console.log("GROQ_API_KEY start:", process.env.GROQ_API_KEY.substring(0, 10) + "...");
}
