import { NextResponse } from "next/server";
import { findRecruiterById, updateRecruiterApproval } from "@/models/User";
import { sendRecruiterApprovalEmail } from "@/lib/email";

export async function POST(request) {
  try {
    const { userId, action, note } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }

    const recruiter = await findRecruiterById(userId);

    if (!recruiter) {
      return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
    }

    await updateRecruiterApproval(userId, action);

    const recipient = recruiter.businessEmail || recruiter.email;
    if (recipient) {
      try {
        await sendRecruiterApprovalEmail({
          to: recipient,
          recruiterName: recruiter.name,
          action,
          note: note?.trim(),
        });
      } catch (emailError) {
        console.error("Recruiter approval email error:", emailError);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Approve recruiter error:", error);
    if (error.message === "Invalid action") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}