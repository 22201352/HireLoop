import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

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

    const client = await clientPromise;
    const db = client.db("hireloop");
    const jobs = db.collection("jobs");

    const newJob = {
      recruiterId,
      recruiterName,
      companyName,
      title,
      description,
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      experienceLevel,
      salaryMin: Number(salaryMin) || 0,
      salaryMax: Number(salaryMax) || 0,
      employmentType,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      status: "pending", // pending | approved | rejected
      isOpen: true, // for later job toggle feature
      createdAt: new Date(),
    };

    const result = await jobs.insertOne(newJob);

    return NextResponse.json(
      { success: true, message: "Job submitted for approval", jobId: result.insertedId },
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

    const client = await clientPromise;
    const db = client.db("hireloop");
    const jobs = db.collection("jobs");

    const query = {};
    if (recruiterId) query.recruiterId = recruiterId;
    if (status) query.status = status;

    const result = await jobs.find(query).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, jobs: result }, { status: 200 });
  } catch (error) {
    console.error("Fetch jobs error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}