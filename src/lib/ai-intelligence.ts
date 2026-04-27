/**
 * AI News Intelligence Engine
 * -------------------------------------------------------------------------
 * Calls multiple LLM providers in parallel, merges and deduplicates their
 * outputs, computes a weighted credibility score, and persists to AiNewsItem.
 *
 * Completely isolated from the manual news submission/moderation system.
 */

import { prisma } from "@/lib/db";

// ── Types ------------------------------------------------------------------

export type ProviderResult = {
  slug: string;
  model: string;
  items: RawAiNewsItem[];
  error?: string;
};

export type RawAiNewsItem = {
  headline: string;
  summaryPoints: string[];
  category: string;
  scope: "LOCAL" | "INDIA" | "WORLD";
  sourceHint?: string;
  credibilityScore: number; // 0-100
  realProbability: number;  // 0-100
};

export type MergedAiNewsItem = RawAiNewsItem & {
  providerBreakdown: Record<
    string,
    { score: number; realProb: number; model: string }
  >;
  finalCredibility: number;
  finalRealProbability: number;
};

// ── Prompt builder ---------------------------------------------------------

function buildPrompt(): string {
  const now = new Date().toISOString();
  return (
    "You are a professional news intelligence analyst. " +
    "Generate exactly 5 verified, current news briefs from the past 1-2 hours (" + now + ").\n\n" +
    "For each brief, respond with ONLY a JSON array (no markdown, no explanation). Each item must have:\n" +
    '- "headline": string (concise, factual, max 120 chars)\n' +
    '- "summaryPoints": string[] (exactly 5 bullet points, factual)\n' +
    '- "category": string (one of: Politics, Technology, Business, Science, Health, Sports, Environment, International, Security)\n' +
    '- "scope": string (one of: LOCAL, INDIA, WORLD)\n' +
    '- "sourceHint": string (e.g. "Reuters, AP", "BBC, Al Jazeera", "TechCrunch, Wired")\n' +
    '- "credibilityScore": number (0-100, your confidence the event is real and accurate)\n' +
    '- "realProbability": number (0-100, probability this is genuine news vs. misinformation)\n\n' +
    "Focus on WORLD and INDIA scope. Base analysis on publicly known, verifiable events.\n" +
    "Be honest about uncertainty in your scores.\n\n" +
    "Return ONLY the JSON array. Example:\n" +
    '[{"headline":"...","summaryPoints":["...","...","...","...","..."],"category":"Technology","scope":"WORLD","sourceHint":"Reuters, BBC","credibilityScore":87,"realProbability":92}]'
  );
}

// ── Provider callers -------------------------------------------------------

async function callGemini(apiKey: string, model: string): Promise<RawAiNewsItem[]> {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    model +
    ":generateContent?key=" +
    apiKey;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt() }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error("Gemini HTTP " + res.status + ": " + body.slice(0, 200));
  }
  const data = await res.json() as Record<string, unknown>;
  const candidates = data.candidates as Array<{ content: { parts: Array<{ text: string }> } }> | undefined;
  const text: string = candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return parseJsonArray(text);
}

async function callGroq(apiKey: string, model: string): Promise<RawAiNewsItem[]> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt() }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error("Groq HTTP " + res.status + ": " + body.slice(0, 200));
  }
  const data = await res.json() as { choices?: Array<{ message: { content: string } }> };
  const text: string = data.choices?.[0]?.message?.content ?? "";
  return parseJsonArray(text);
}

async function callCohere(apiKey: string, model: string): Promise<RawAiNewsItem[]> {
  const res = await fetch("https://api.cohere.com/v1/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model,
      prompt: buildPrompt(),
      max_tokens: 4096,
      temperature: 0.3,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error("Cohere HTTP " + res.status + ": " + body.slice(0, 200));
  }
  const data = await res.json() as { generations?: Array<{ text: string }> };
  const text: string = data.generations?.[0]?.text ?? "";
  return parseJsonArray(text);
}

async function callMistral(apiKey: string, model: string): Promise<RawAiNewsItem[]> {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt() }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error("Mistral HTTP " + res.status + ": " + body.slice(0, 200));
  }
  const data = await res.json() as { choices?: Array<{ message: { content: string } }> };
  const text: string = data.choices?.[0]?.message?.content ?? "";
  return parseJsonArray(text);
}

/**
 * OpenRouter - unified gateway to 200+ models (OpenAI-compatible API).
 * Docs: https://openrouter.ai/docs
 */
async function callOpenRouter(apiKey: string, model: string): Promise<RawAiNewsItem[]> {
  const referer = process.env.APP_URL ?? "https://thefourthpillar.netlify.app";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey,
      "HTTP-Referer": referer,
      "X-Title": "The Fourth Pillar AI Intelligence Engine",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt() }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error("OpenRouter HTTP " + res.status + ": " + body.slice(0, 200));
  }
  const data = await res.json() as { choices?: Array<{ message: { content: string } }> };
  const text: string = data.choices?.[0]?.message?.content ?? "";
  return parseJsonArray(text);
}

// ── JSON parser (robust) ---------------------------------------------------

function parseJsonArray(raw: string): RawAiNewsItem[] {
  try {
    const clean = raw
      .replace(/^```(?:json)?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    const firstBracket = clean.indexOf("[");
    const lastBracket = clean.lastIndexOf("]");
    if (firstBracket === -1 || lastBracket === -1) return [];

    const arr = JSON.parse(clean.slice(firstBracket, lastBracket + 1)) as unknown[];
    if (!Array.isArray(arr)) return [];

    return arr.filter(
      (item): item is RawAiNewsItem =>
        typeof (item as Record<string, unknown>).headline === "string" &&
        Array.isArray((item as Record<string, unknown>).summaryPoints) &&
        typeof (item as Record<string, unknown>).credibilityScore === "number" &&
        typeof (item as Record<string, unknown>).realProbability === "number"
    );
  } catch {
    return [];
  }
}

// ── Dispatch to provider ---------------------------------------------------

async function callProvider(slug: string, model: string, apiKey: string): Promise<RawAiNewsItem[]> {
  switch (slug) {
    case "gemini":      return callGemini(apiKey, model);
    case "groq":        return callGroq(apiKey, model);
    case "cohere":      return callCohere(apiKey, model);
    case "mistral":     return callMistral(apiKey, model);
    case "openrouter":  return callOpenRouter(apiKey, model);
    default:            throw new Error("Unknown provider slug: " + slug);
  }
}

// ── Deduplication by headline similarity ----------------------------------

function isSimilarHeadline(a: string, b: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").filter(Boolean);
  const wordsA = new Set(normalize(a));
  const wordsB = normalize(b);
  const overlap = wordsB.filter((w) => wordsA.has(w)).length;
  const similarity = overlap / Math.max(wordsA.size, wordsB.length);
  return similarity > 0.55;
}

// ── Main orchestrator ------------------------------------------------------

export async function runIntelligenceFetch(): Promise<{
  saved: number;
  providerResults: ProviderResult[];
  errors: string[];
}> {
  // 1. Load enabled providers from DB
  const providers = await prisma.aiProvider.findMany({
    where: { enabled: true },
  });

  if (providers.length === 0) {
    return { saved: 0, providerResults: [], errors: ["No providers enabled"] };
  }

  // 2. Call all providers in parallel (fail-safe)
  const providerResults: ProviderResult[] = await Promise.all(
    providers.map(async (p) => {
      const apiKey = process.env[p.apiKeyEnv];
      if (!apiKey) {
        return {
          slug: p.slug,
          model: p.model,
          items: [],
          error: "Missing env var: " + p.apiKeyEnv,
        };
      }
      try {
        const items = await callProvider(p.slug, p.model, apiKey);
        await prisma.aiProvider.update({
          where: { id: p.id },
          data: { lastUsedAt: new Date() },
        });
        return { slug: p.slug, model: p.model, items };
      } catch (err) {
        return {
          slug: p.slug,
          model: p.model,
          items: [],
          error: err instanceof Error ? err.message : String(err),
        };
      }
    })
  );

  // 3. Deduplicate and merge across providers
  const merged: MergedAiNewsItem[] = [];
  const errors: string[] = providerResults
    .filter((r) => r.error)
    .map((r) => r.slug + ": " + r.error);

  for (const result of providerResults) {
    if (result.error || result.items.length === 0) continue;
    const providerWeight =
      providers.find((p) => p.slug === result.slug)?.weight ?? 1.0;

    for (const item of result.items) {
      const existing = merged.find((m) =>
        isSimilarHeadline(m.headline, item.headline)
      );
      if (existing) {
        existing.providerBreakdown[result.slug] = {
          score: item.credibilityScore,
          realProb: item.realProbability,
          model: result.model,
        };
        const breakdown = Object.entries(existing.providerBreakdown);
        const totalWeight = breakdown.reduce((acc, [slug]) => {
          const w = providers.find((p) => p.slug === slug)?.weight ?? 1.0;
          return acc + w;
        }, 0);
        existing.finalCredibility =
          breakdown.reduce((acc, [slug, d]) => {
            const w = providers.find((p) => p.slug === slug)?.weight ?? 1.0;
            return acc + d.score * w;
          }, 0) / totalWeight;
        existing.finalRealProbability =
          breakdown.reduce((acc, [slug, d]) => {
            const w = providers.find((p) => p.slug === slug)?.weight ?? 1.0;
            return acc + d.realProb * w;
          }, 0) / totalWeight;
      } else {
        const validScope = ["LOCAL", "INDIA", "WORLD"].includes(item.scope)
          ? item.scope
          : "WORLD";
        merged.push({
          ...item,
          scope: validScope as "LOCAL" | "INDIA" | "WORLD",
          providerBreakdown: {
            [result.slug]: {
              score: item.credibilityScore,
              realProb: item.realProbability,
              model: result.model,
            },
          },
          finalCredibility: item.credibilityScore * providerWeight,
          finalRealProbability: item.realProbability * providerWeight,
        });
      }
    }
  }

  // 4. Save to database
  let saved = 0;
  for (const item of merged) {
    try {
      await prisma.aiNewsItem.create({
        data: {
          headline: item.headline,
          summaryPoints: JSON.stringify(item.summaryPoints),
          category: item.category,
          scope: item.scope,
          sourceHint: item.sourceHint ?? null,
          credibilityScore: Math.min(100, Math.max(0, item.finalCredibility)),
          realProbability: Math.min(100, Math.max(0, item.finalRealProbability)),
          providerBreakdown: JSON.stringify(item.providerBreakdown),
          isActive: true,
        },
      });
      saved++;
    } catch {
      // Skip duplicate/invalid items
    }
  }

  return { saved, providerResults, errors };
}

// ── Seed default providers -------------------------------------------------

export const DEFAULT_PROVIDERS = [
  {
    name: "OpenRouter",
    slug: "openrouter",
    model: "meta-llama/llama-4-scout:free",
    apiKeyEnv: "OPENROUTER_API_KEY",
    weight: 1.3,
  },
  {
    name: "Google Gemini",
    slug: "gemini",
    model: "gemini-1.5-flash",
    apiKeyEnv: "GEMINI_API_KEY",
    weight: 1.2,
  },
  {
    name: "Groq (Llama 3)",
    slug: "groq",
    model: "llama3-70b-8192",
    apiKeyEnv: "GROQ_API_KEY",
    weight: 1.0,
  },
  {
    name: "Cohere Command",
    slug: "cohere",
    model: "command-r",
    apiKeyEnv: "COHERE_API_KEY",
    weight: 0.9,
  },
  {
    name: "Mistral AI",
    slug: "mistral",
    model: "mistral-small-latest",
    apiKeyEnv: "MISTRAL_API_KEY",
    weight: 0.9,
  },
] as const;

export async function seedDefaultProviders() {
  for (const p of DEFAULT_PROVIDERS) {
    const keySet = !!process.env[p.apiKeyEnv];
    // Auto-enable providers whose key is already in .env
    const autoEnable = keySet && (p.slug === "openrouter" || p.slug === "groq" || p.slug === "gemini");
    await prisma.aiProvider.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, enabled: autoEnable },
    });
  }
}
