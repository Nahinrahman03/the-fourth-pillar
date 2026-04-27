import { NextResponse } from "next/server";
import { getCurrentUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * DELETE /api/admin/users/[id]
 * Permanently removes a user and their associated data (profile, submissions, etc.) 
 * via cascade delete defined in the schema.
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

    // Prevent self-deletion
    if (user.id === id) {
      return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: "User removed successfully" 
    });
  } catch (error) {
    console.error("Delete User error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" }, 
      { status: 500 }
    );
  }
}
