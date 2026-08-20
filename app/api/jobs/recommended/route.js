import { NextResponse } from "next/server";
import { getResumeByCandidateId } from "@/models/Resume";
import { getRecommendedJobs } from "@/models/Job";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get("candidateId");

    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidateId" }, { status: 400 });
    }

    const resume = await getResumeByCandidateId(candidateId);

    if (!resume || !resume.parsedText) {
      // Candidate hasn't uploaded a resume yet — not an error, just no recommendations
      return NextResponse.json({ success: true, jobs: [] }, { status: 200 });
    }

    const recommendedJobs = await getRecommendedJobs(resume.parsedText);

    return NextResponse.json({ success: true, jobs: recommendedJobs }, { status: 200 });
  } catch (error) {
    console.error("Recommended jobs error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}