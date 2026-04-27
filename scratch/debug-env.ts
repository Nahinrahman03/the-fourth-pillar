import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const providers = await prisma.aiProvider.findMany();
  console.log("Providers Detail:");
  console.table(providers.map(p => ({ 
    slug: p.slug, 
    enabled: p.enabled, 
    apiKeyEnv: p.apiKeyEnv,
    model: p.model 
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
