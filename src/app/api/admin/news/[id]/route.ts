import { NextResponse } from "next/server";

import { getCurrentUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    if (!isElevatedRole(user.role)) {
      return NextResponse.json({ error: "Only admins can delete news." }, { status: 403 });
    }

    const { id } = await context.params;

    const item = await prisma.newsItem.findUnique({ where: { id } });

    if (!item) {
      return NextResponse.json({ error: "News item not found." }, { status: 404 });
    }

    await prisma.newsItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not delete news item.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
