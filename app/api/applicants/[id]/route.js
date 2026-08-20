import { NextResponse } from "next/server";
import { getApplicationsByJobId, updateApplicationSkillScore } from "@/models/Application";
import { getInterviewByApplicationId } from "@/models/Interview";
import myDatabaseConnection from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const applications = await getApplicationsByJobId(id);

    const client = await myDatabaseConnection;
    const db = client.db("hireloop");
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(id) });

    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        let candidateEmail = null;
        let interview = null;

        try {
          const resume = await db.collection("resumes").findOne({ candidateId: app.candidateId });
          const updatedApplication = await updateApplicationSkillScore(
            app._id,
            job?.skills,
            resume?.parsedText
          );

          if (updatedApplication) {
            app = updatedApplication;
          }
        } catch (scoreError) {
          console.error("Failed to refresh application score:", scoreError);
        }

        try {
          const candidate = await db.collection("users").findOne({
            _id: new ObjectId(app.candidateId),
          });
          candidateEmail = candidate?.email || null;
        } catch {
          candidateEmail = null;
        }

        if (app.status === "shortlisted") {
          try {
            interview = await getInterviewByApplicationId(app._id.toString());
          } catch {
            interview = null;
          }
        }

        return { ...app, candidateEmail, interview };
      })
    );

    return NextResponse.json(
      { success: true, applications: enrichedApplications },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch job applicants error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}