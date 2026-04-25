import { NextResponse } from "next/server";
import { requireUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (!isElevatedRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ads = await prisma.advertisement.findMany();
  return NextResponse.json({ ads });
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
