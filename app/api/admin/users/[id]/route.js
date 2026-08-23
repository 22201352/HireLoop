import { NextResponse } from "next/server";
import { findRecruiterById, findUserForAdmin } from "@/models/User";
import { getResumeByCandidateId } from "@/models/Resume";
import { getJobById } from "@/models/Job";

export async function GET(request, { params }) {
  try {
    let user = await findUserForAdmin(params.id);

    // Older recruiter complaints could store the related job ID as their user target.
    if (!user) {
      const legacyJob = await getJobById(params.id);
      if (legacyJob?.recruiterId) {
        user = await findRecruiterById(legacyJob.recruiterId);
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const resume = user.role === "candidate"
      ? await getResumeByCandidateId(params.id)
      : null;

    return NextResponse.json({
      success: true,
      user,
      resume: resume ? {
        fileUrl: resume.fileUrl,
        parsedText: resume.parsedText || "",
        updatedAt: resume.updatedAt || resume.createdAt,
      } : null,
    }, { status: 200 });
  } catch (error) {
    console.error("Fetch admin user error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}