import { NextResponse } from "next/server";
import { requireUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (!isElevatedRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ads = await prisma.advertisement.findMany();

  // Aggregate platform-wide engagement for ad performance context
  const [totalViews, totalClicks, totalNews, liveAds] = await Promise.all([
    prisma.newsItem.aggregate({ _sum: { views: true } }),
    prisma.newsItem.aggregate({ _sum: { clicks: true } }),
    prisma.newsItem.count(),
    prisma.advertisement.count({ where: { enabled: true } }),
  ]);

  const platformViews = totalViews._sum.views ?? 0;
  const platformClicks = totalClicks._sum.clicks ?? 0;
  const platformCTR = platformViews > 0
    ? ((platformClicks / platformViews) * 100).toFixed(2)
    : "0.00";

  return NextResponse.json({
    ads,
    metrics: {
      platformViews,
      platformClicks,
      platformCTR,
      totalNews,
      liveAds,
    },
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!isElevatedRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const { slotId, enabled, imageUrl, linkUrl, label, title, body, ctaText, altText } = data;

  if (!slotId) {
    return NextResponse.json({ error: "Missing slotId" }, { status: 400 });
  }

  const ad = await prisma.advertisement.upsert({
    where: { slotId },
    update: { enabled, imageUrl, linkUrl, label, title, body, ctaText, altText },
    create: { slotId, enabled, imageUrl: imageUrl || "", linkUrl: linkUrl || "", label, title, body, ctaText, altText },
  });

  return NextResponse.json({ ad });
}

export async function DELETE(req: Request) {
  const user = await requireUser();
  if (!isElevatedRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slotId } = await req.json() as { slotId: string };
  if (!slotId) return NextResponse.json({ error: "Missing slotId" }, { status: 400 });

  await prisma.advertisement.deleteMany({ where: { slotId } });
  return NextResponse.json({ success: true });
}
