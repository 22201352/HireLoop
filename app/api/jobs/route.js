import { NextResponse } from "next/server";
import { createJob, getJobs } from "@/models/Job";

// Create a new job posting
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      recruiterId,
      recruiterName,
      companyName,
      title,
      description,
      skills,
      experienceLevel,
      salaryMin,
      salaryMax,
      employmentType,
      applicationDeadline,
    } = body;

    if (!recruiterId || !title || !description || !skills || !experienceLevel || !employmentType) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
    }

    const jobId = await createJob({
      recruiterId,
      recruiterName,
      companyName,
      title,
      description,
      skills,
      experienceLevel,
      salaryMin,
      salaryMax,
      employmentType,
      applicationDeadline,
    });

    return NextResponse.json(
      { success: true, message: "Job submitted for approval", jobId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Job posting error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Get jobs — supports filtering by recruiterId or status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const recruiterId = searchParams.get("recruiterId");
    const status = searchParams.get("status");

    const jobs = await getJobs({ recruiterId, status });

    return NextResponse.json({ success: true, jobs }, { status: 200 });
  } catch (error) {
    console.error("Fetch jobs error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}