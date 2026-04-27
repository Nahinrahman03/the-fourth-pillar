import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Updating models in DB...");
  
  // Update Groq to the new supported model
  await prisma.aiProvider.update({
    where: { slug: "groq" },
    data: { 
      name: "Groq (Llama 3.3)",
      model: "llama-3.3-70b-versatile",
      enabled: true 
    },
  });

  // Update Gemini to 1.5 Flash (Standard)
  await prisma.aiProvider.update({
    where: { slug: "gemini" },
    data: { 
      model: "gemini-1.5-flash",
      enabled: true 
    },
  });

  console.log("Done. Groq and Gemini updated and enabled.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
