import { NextResponse } from "next/server";
import { toggleJobStatus } from "@/models/Job";

export async function POST(request) {
  try {
    const { jobId, isOpen } = await request.json();

    if (!jobId || typeof isOpen !== "boolean") {
      return NextResponse.json({ error: "Missing jobId or isOpen" }, { status: 400 });
    }

    await toggleJobStatus(jobId, isOpen);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Toggle job error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}