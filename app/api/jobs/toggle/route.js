import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { jobId, isOpen } = await request.json();

    if (!jobId || typeof isOpen !== "boolean") {
      return NextResponse.json({ error: "Missing jobId or isOpen" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("hireloop");
    const jobs = db.collection("jobs");

    await jobs.updateOne(
      { _id: new ObjectId(jobId) },
      { $set: { isOpen } }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Toggle job error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}