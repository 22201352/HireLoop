import { NextResponse } from "next/server";
import { searchApprovedJobs, getSkillMatchScore } from "@/models/Job";
import { getResumeByCandidateId } from "@/models/Resume";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");
    const employmentType = searchParams.get("employmentType");
    const experienceLevel = searchParams.get("experienceLevel");
    const skill = searchParams.get("skill");
    const minSalary = searchParams.get("minSalary");
    const sortBy = searchParams.get("sortBy") || "newest";
    const candidateId = searchParams.get("candidateId");

    const jobs = await searchApprovedJobs({
      keyword,
      employmentType,
      experienceLevel,
      skill,
      minSalary,
      sortBy,
    });

    if (candidateId) {
      const resume = await getResumeByCandidateId(candidateId);
      return NextResponse.json({
        success: true,
        jobs: jobs.map((job) => ({
          ...job,
          skillMatchScore: getSkillMatchScore(job.skills, resume?.parsedText),
        })),
      }, { status: 200 });
    }

    return NextResponse.json({ success: true, jobs }, { status: 200 });
  } catch (error) {
    console.error("Fetch approved jobs error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}