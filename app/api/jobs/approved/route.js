import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");
    const employmentType = searchParams.get("employmentType");
    const experienceLevel = searchParams.get("experienceLevel");
    const skill = searchParams.get("skill");
    const minSalary = searchParams.get("minSalary");
    const sortBy = searchParams.get("sortBy") || "newest";

    const client = await clientPromise;
    const db = client.db("hireloop");
    const jobs = db.collection("jobs");

    const query = { status: "approved", isOpen: true };

    if (keyword) {
      query.title = { $regex: keyword, $options: "i" };
    }

    if (employmentType) {
      query.employmentType = employmentType;
    }

    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }

    if (skill) {
      query.skills = { $regex: skill, $options: "i" };
    }

    if (minSalary) {
      query.salaryMax = { $gte: Number(minSalary) };
    }

    const sortOption = sortBy === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const result = await jobs.find(query).sort(sortOption).toArray();

    return NextResponse.json({ success: true, jobs: result }, { status: 200 });
  } catch (error) {
    console.error("Fetch approved jobs error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}