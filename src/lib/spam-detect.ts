/**
 * Basic spam detection logic for news submissions.
 */

const FORBIDDEN_KEYWORDS = [
  "casino",
  "buy crypto",
  "get rich quick",
  "free money",
  "earn from home",
  "viagra",
  "poker",
  "betting"
];

export function detectSpam(text: string): { isSpam: boolean; reason?: string } {
  const content = text.toLowerCase();

  // 1. Check for forbidden keywords
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (content.includes(keyword)) {
      return { isSpam: true, reason: `Contains forbidden keyword: ${keyword}` };
    }
  }

  // 2. Check for suspicious repetition (e.g., "word word word word word")
  const words = content.split(/\s+/).filter(w => w.length > 0);
  for (let i = 0; i < words.length - 4; i++) {
    const sequence = words.slice(i, i + 3).join(" ");
    const rest = words.slice(i + 3, i + 10).join(" ");
    if (rest.includes(sequence)) {
      return { isSpam: true, reason: "Repetitive content detected" };
    }
  }

  // 3. Check for excessive capital letters (> 70% of text)
  const totalChars = text.replace(/\s/g, "").length;
  if (totalChars > 20) {
    const upperChars = text.replace(/[^A-Z]/g, "").length;
    if (upperChars / totalChars > 0.7) {
      return { isSpam: true, reason: "Excessive use of capital letters" };
    }
  }

  // 4. Check for very low word-to-character ratio (nonsense)
  if (totalChars > 50) {
    const averageWordLength = totalChars / words.length;
    if (averageWordLength > 20) {
      return { isSpam: true, reason: "Suspiciously long words detected" };
    }
  }

  return { isSpam: false };
}

export function analyzeSubmission(headline: string, details?: string): { isSpam: boolean; reason?: string } {
  const headlineAnalysis = detectSpam(headline);
  if (headlineAnalysis.isSpam) return headlineAnalysis;

  if (details) {
    const detailsAnalysis = detectSpam(details);
    if (detailsAnalysis.isSpam) return detailsAnalysis;
  }

  return { isSpam: false };
}
