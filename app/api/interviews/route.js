import { NextResponse } from "next/server";
import { proposeInterview, getInterviewsByCandidateId, getInterviewByApplicationId } from "@/models/Interview";
import { sendInterviewProposedEmail } from "@/lib/email";
import myDatabaseConnection from "@/lib/mongodb";
import { ObjectId } from "mongodb";
export async function POST(request) {
  try {
    const body = await request.json();
    const { applicationId, candidateId, candidateName, recruiterId, jobTitle, companyName, proposedSlots } = body;

    if (!applicationId || !candidateId || !proposedSlots || proposedSlots.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingInterview = await getInterviewByApplicationId(applicationId);
    if (existingInterview) {
      return NextResponse.json(
        { error: "An interview has already been proposed for this application" },
        { status: 409 }
      );
    }

    const interviewId = await proposeInterview({
      applicationId,
      candidateId,
      candidateName,
      recruiterId,
      jobTitle,
      companyName,
      proposedSlots,
    });

    try {
      const client = await myDatabaseConnection;
      const db = client.db("hireloop");
      const candidate = await db.collection("users").findOne({
        _id: new ObjectId(candidateId),
      });

      if (candidate?.email) {
        await sendInterviewProposedEmail({
          to: candidate.email,
          candidateName,
          jobTitle,
          companyName,
          proposedSlots,
        });
      }
    } catch (emailError) {
      console.error("Failed to send interview proposed email:", emailError);
    }

    return NextResponse.json(
      { success: true, interviewId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Propose interview error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get("candidateId");
    const applicationId = searchParams.get("applicationId");

    if (applicationId) {
      const interview = await getInterviewByApplicationId(applicationId);
      return NextResponse.json(
        { success: true, interview },
        { status: 200 }
      );
    }

    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId or applicationId is required" },
        { status: 400 }
      );
    }

    const interviews = await getInterviewsByCandidateId(candidateId);

    return NextResponse.json(
      { success: true, interviews },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch interviews error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
