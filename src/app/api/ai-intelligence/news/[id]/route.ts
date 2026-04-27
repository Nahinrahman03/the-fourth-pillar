import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * DELETE /api/ai-intelligence/news/[id]
 * Soft-deletes an AI news item by setting isActive to false.
 * Admin-only operation.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // Strict Admin check - only let the specific admin email perform this
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.aiNewsItem.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ 
      success: true, 
      message: "AI News item removed successfully" 
    });
  } catch (error) {
    console.error("Delete AI News error:", error);
    return NextResponse.json(
      { error: "Failed to delete AI news item" }, 
      { status: 500 }
    );
  }
}
