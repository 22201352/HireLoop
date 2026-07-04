import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// Get all jobs (for admin review)
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("hireloop");
    const jobs = db.collection("jobs");

    const result = await jobs.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, jobs: result }, { status: 200 });
  } catch (error) {
    console.error("Fetch jobs error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Approve or reject a job, with optional admin note
export async function POST(request) {
  try {
    const { jobId, action, note } = await request.json(); // action: "approve" or "reject"

    if (!jobId || !action) {
      return NextResponse.json({ error: "Missing jobId or action" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("hireloop");
    const jobs = db.collection("jobs");

    const newStatus = action === "approve" ? "approved" : "rejected";

    await jobs.updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          status: newStatus,
          adminNote: note || "",
          reviewedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Job approval error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}