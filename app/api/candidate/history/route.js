import { NextResponse } from "next/server";
import { getApplicationsWithJobDetails } from "@/models/Application";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get("candidateId");

    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId is required" },
        { status: 400 }
      );
    }

    const applications = await getApplicationsWithJobDetails(candidateId);

    return NextResponse.json(
      { success: true, applications },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch application history error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}