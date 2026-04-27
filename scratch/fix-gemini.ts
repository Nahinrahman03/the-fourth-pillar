import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const r = await prisma.aiProvider.update({ where: { slug: "gemini" }, data: { model: "gemini-pro" } });
  console.log("Updated model to:", r.model);
}
main().catch(console.error).finally(() => prisma.$disconnect());
