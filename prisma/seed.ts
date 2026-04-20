import { NewsScope, PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAILS?.split(",")[0]?.trim().toLowerCase();

  if (adminEmail) {
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: UserRole.ADMIN },
      create: {
        email: adminEmail,
        role: UserRole.ADMIN,
        profile: {
          create: {}
        }
      }
    });

    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: "SYSTEM",
        title: "Admin account ready",
        body: "This account can review and approve contributor submissions.",
        href: "/admin/review"
      }
    });
  }

  const systemUser = await prisma.user.upsert({
    where: { email: "system@local.dev" },
    update: {},
    create: {
      email: "system@local.dev",
      name: "System Publisher",
      role: UserRole.ADMIN,
      profile: {
        create: {}
      }
    }
  });

  const samples = [
    {
      headline: "City transit launches new express route across major business hubs",
      slug: "city-transit-launches-new-express-route-across-major-business-hubs",
      category: "Local",
      scope: NewsScope.LOCAL,
      summaryPoints: JSON.stringify([
        "The route connects the airport, central station, and financial district.",
        "Officials say peak-hour travel time could drop by nearly 20 minutes.",
        "The first two weeks include discounted commuter passes.",
        "Passenger feedback will shape future route expansion."
      ])
    },
    {
      headline: "India expands grid-scale battery pilot across three industrial corridors",
      slug: "india-expands-grid-scale-battery-pilot-across-three-industrial-corridors",
      category: "Science",
      scope: NewsScope.INDIA,
      summaryPoints: JSON.stringify([
        "The programme links new storage sites in Gujarat, Maharashtra, and Tamil Nadu.",
        "Energy officials say the pilot is meant to stabilize evening demand during summer peaks.",
        "Two public research labs will publish reliability data before nationwide rollout."
      ])
    },
    {
      headline: "Global shipping insurers tighten Red Sea routing rules for cargo operators",
      slug: "global-shipping-insurers-tighten-red-sea-routing-rules-for-cargo-operators",
      category: "World",
      scope: NewsScope.WORLD,
      summaryPoints: JSON.stringify([
        "Several insurers now require updated risk declarations before vessels enter high-risk corridors.",
        "Freight analysts expect longer delivery windows for electronics and machinery shipments.",
        "Retail importers are reviewing backup routes to reduce disruption during peak ordering cycles."
      ])
    }
  ];

  for (const sample of samples) {
    await prisma.newsItem.upsert({
      where: { slug: sample.slug },
      update: {
        headline: sample.headline,
        category: sample.category,
        scope: sample.scope,
        summaryPoints: sample.summaryPoints,
        approvedById: systemUser.id
      },
      create: {
        ...sample,
        createdById: systemUser.id,
        approvedById: systemUser.id
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
