import { NextResponse } from "next/server";
import { createApplication, getApplicationsByCandidateId } from "@/models/Application";
import { getResumeByCandidateId } from "@/models/Resume";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Submit a job application (Feature #5) — triggers AI scoring (Feature #6)
export async function POST(request) {
  try {
    const { candidateId, candidateName, jobId } = await request.json();

    if (!candidateId || !jobId) {
      return NextResponse.json({ error: "candidateId and jobId are required" }, { status: 400 });
    }

    // Get the candidate's resume
    const resume = await getResumeByCandidateId(candidateId);
    if (!resume) {
      return NextResponse.json(
        { error: "Please upload your resume before applying" },
        { status: 400 }
      );
    }

    // Get the job details
    const client = await clientPromise;
    const db = client.db("hireloop");
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "approved" || !job.isOpen) {
      return NextResponse.json({ error: "This job is not currently accepting applications" }, { status: 400 });
    }

    const result = await createApplication({
      candidateId,
      candidateName,
      jobId,
      jobTitle: job.title,
      companyName: job.companyName,
      recruiterId: job.recruiterId,
      jobDescription: job.description,
      resumeText: resume.parsedText,
      resumeUrl: resume.fileUrl,
    });

    return NextResponse.json(
      { success: true, message: "Application submitted successfully", ...result },
      { status: 201 }
    );
  } catch (error) {
    console.error("Application submission error:", error);
    if (error.message === "You have already applied to this job") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Get all applications for a candidate (Feature #11)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get("candidateId");

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
    }

    const applications = await getApplicationsByCandidateId(candidateId);

    return NextResponse.json({ success: true, applications }, { status: 200 });
  } catch (error) {
    console.error("Fetch applications error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}