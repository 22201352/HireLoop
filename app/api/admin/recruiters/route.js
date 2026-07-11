import { NextResponse } from "next/server";
import { getRecruiters } from "@/models/User";

export async function GET() {
  try {
    const recruiters = await getRecruiters();
    return NextResponse.json({ success: true, recruiters }, { status: 200 });
  } catch (error) {
    console.error("Fetch recruiters error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}