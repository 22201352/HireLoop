import { NextResponse } from "next/server";
import { getAllJobsForAdmin, getJobById, reviewJob } from "@/models/Job";
import { findRecruiterById } from "@/models/User";

// Get all jobs (for admin review)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const jobs = jobId ? await getJobById(jobId) : await getAllJobsForAdmin();

    if (jobId && !jobs) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const recruiter = jobId ? await findRecruiterById(jobs.recruiterId) : undefined;

    return NextResponse.json({
      success: true,
      job: jobId ? jobs : undefined,
      recruiter,
      jobs: jobId ? undefined : jobs,
    }, { status: 200 });
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
import { removeJob } from "@/models/Job";

export async function DELETE(request) {
  try {
    const { jobId, note } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    await removeJob(jobId, note);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Job removal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}