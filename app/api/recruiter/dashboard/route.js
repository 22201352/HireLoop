import { NextResponse } from "next/server";
import { getRecruiterApplicationStats } from "@/models/Application";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const recruiterId = searchParams.get("recruiterId");

    if (!recruiterId) {
      return NextResponse.json({ error: "recruiterId is required" }, { status: 400 });
    }

    const stats = await getRecruiterApplicationStats(recruiterId);

    return NextResponse.json({ success: true, stats }, { status: 200 });
  } catch (error) {
    console.error("Recruiter dashboard stats error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}