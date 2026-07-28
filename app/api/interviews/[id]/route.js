import { NextResponse } from "next/server";
import { confirmInterviewSlot } from "@/models/Interview";
import { sendInterviewConfirmedEmail } from "@/lib/email";
import myDatabaseConnection from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { selectedSlot } = await request.json();

    if (!selectedSlot) {
      return NextResponse.json(
        { error: "selectedSlot is required" },
        { status: 400 }
      );
    }

    const updatedInterview = await confirmInterviewSlot(id, selectedSlot);

    if (!updatedInterview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    try {
      const client = await myDatabaseConnection;
      const db = client.db("hireloop");
      const recruiter = await db.collection("users").findOne({
        _id: new ObjectId(updatedInterview.recruiterId),
      });

      if (recruiter?.email) {
        await sendInterviewConfirmedEmail({
          to: recruiter.email,
          candidateName: updatedInterview.candidateName,
          jobTitle: updatedInterview.jobTitle,
          confirmedSlot: updatedInterview.confirmedSlot,
        });
      }
    } catch (emailError) {
      console.error("Failed to send interview confirmed email:", emailError);
    }

    return NextResponse.json(
      { success: true, interview: updatedInterview },
      { status: 200 }
    );
  } catch (error) {
    console.error("Confirm interview error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}