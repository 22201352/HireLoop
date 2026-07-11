import { NextResponse } from "next/server";
import { getAllJobsForAdmin, reviewJob } from "@/models/Job";

// Get all jobs (for admin review)
export async function GET() {
  try {
    const jobs = await getAllJobsForAdmin();
    return NextResponse.json({ success: true, jobs }, { status: 200 });
  } catch (error) {
    console.error("Fetch jobs error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Approve or reject a job, with optional admin note
export async function POST(request) {
  try {
    const { jobId, action, note } = await request.json();

    if (!jobId || !action) {
      return NextResponse.json({ error: "Missing jobId or action" }, { status: 400 });
    }

    await reviewJob(jobId, action, note);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Job approval error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}