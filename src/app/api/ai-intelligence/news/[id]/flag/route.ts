import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/ai-intelligence/news/[id]/flag
 * Increments the flag count for an AI-generated news item.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const updated = await prisma.aiNewsItem.update({
      where: { id },
      data: {
        flagCount: { increment: 1 },
      },
    });

    return NextResponse.json({ 
      success: true, 
      flagCount: updated.flagCount 
    });
  } catch (error) {
    console.error("Flag AI News error:", error);
    return NextResponse.json(
      { error: "Failed to flag news item" }, 
      { status: 500 }
    );
  }
}
