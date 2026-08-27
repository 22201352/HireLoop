import { NextResponse } from "next/server";
import { getAdminUserStats } from "@/models/User";
import { getAdminJobStats } from "@/models/Job";
import { getAdminApplicationStats } from "@/models/Application";

export async function GET() {
  try {
    const [users, jobsStat, applications] = await Promise.all([
      getAdminUserStats(),
      getAdminJobStats(),
      getAdminApplicationStats(),
    ]);

    return NextResponse.json(
      { success: true, users, jobs: jobsStat, applications },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}