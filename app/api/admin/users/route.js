import { NextResponse } from "next/server";
import { getAllUsersForAdmin, suspendUser } from "@/models/User";

export async function GET() {
  try {
    const users = await getAllUsersForAdmin();
    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error("Fetch all users error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await suspendUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Deactivate user error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}