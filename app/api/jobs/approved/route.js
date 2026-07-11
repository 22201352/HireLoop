import { NextResponse } from "next/server";
import { searchApprovedJobs } from "@/models/Job";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");
    const employmentType = searchParams.get("employmentType");
    const experienceLevel = searchParams.get("experienceLevel");
    const skill = searchParams.get("skill");
    const minSalary = searchParams.get("minSalary");
    const sortBy = searchParams.get("sortBy") || "newest";

    const jobs = await searchApprovedJobs({
      keyword,
      employmentType,
      experienceLevel,
      skill,
      minSalary,
      sortBy,
    });

    return NextResponse.json({ success: true, jobs }, { status: 200 });
  } catch (error) {
    console.error("Fetch approved jobs error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}