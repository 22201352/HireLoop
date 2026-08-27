import { NextResponse } from "next/server";
import { findRecruiterById, updateRecruiterProfile } from "@/models/User";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const recruiterId = searchParams.get("recruiterId");

    if (!recruiterId) {
      return NextResponse.json({ error: "recruiterId is required" }, { status: 400 });
    }

    const profile = await findRecruiterById(recruiterId);
    if (!profile) {
      return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile }, { status: 200 });
  } catch (error) {
    console.error("Get recruiter profile error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { recruiterId, ...updates } = await request.json();

    if (!recruiterId) {
      return NextResponse.json({ error: "recruiterId is required" }, { status: 400 });
    }

    const updated = await updateRecruiterProfile(recruiterId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: updated }, { status: 200 });
  } catch (error) {
    console.error("Update recruiter profile error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}