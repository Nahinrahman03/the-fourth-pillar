import { NextResponse } from "next/server";
import { getCurrentUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * DELETE /api/admin/submissions/[id]
 * Permanently removes a submission from the database.
 * Admin-only operation.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || !isElevatedRole(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.submission.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Submission removed successfully" 
    });
  } catch (error) {
    console.error("Delete Submission error:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" }, 
      { status: 500 }
    );
  }
}
