import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isElevatedRole } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const type = body.type; // "view" or "click"

    const country =
      req.headers.get("x-country-code") || // Netlify
      req.headers.get("x-vercel-ip-country") || // Vercel
      req.headers.get("cf-ipcountry") || // Cloudflare
      "Unknown";

    // ── Skip tracking if user is a Developer/Admin ──
    const user = await getCurrentUser();
    if (user && isElevatedRole(user.role)) {
      return NextResponse.json({ success: true, skipped: true, reason: "developer_view" });
    }

    if (type === "view") {
      await prisma.newsItem.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
      await prisma.newsEvent.create({
        data: {
          newsItemId: id,
          eventType: "VIEW",
          country,
        }
      });
    } else if (type === "click") {
      await prisma.newsItem.update({
        where: { id },
        data: { clicks: { increment: 1 } },
      });
      await prisma.newsEvent.create({
        data: {
          newsItemId: id,
          eventType: "CLICK",
          country,
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
