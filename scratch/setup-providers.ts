import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Enable Groq with its correct model
  await prisma.aiProvider.update({
    where: { slug: "groq" },
    data: { enabled: true, model: "llama3-70b-8192" },
  });
  console.log("Groq: enabled");

  // Update Gemini model to gemini-1.5-flash (most compatible with AI Studio keys)
  await prisma.aiProvider.update({
    where: { slug: "gemini" },
    data: { model: "gemini-1.5-flash" },
  });
  console.log("Gemini: model updated to gemini-1.5-flash");

  // Show final state
  const all = await prisma.aiProvider.findMany({ orderBy: { name: "asc" } });
  console.table(all.map(p => ({ slug: p.slug, enabled: p.enabled, model: p.model })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
