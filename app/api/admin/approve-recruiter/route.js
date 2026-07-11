import { NextResponse } from "next/server";
import { updateRecruiterApproval } from "@/models/User";

export async function POST(request) {
  try {
    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }

    await updateRecruiterApproval(userId, action);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Approve recruiter error:", error);
    if (error.message === "Invalid action") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}