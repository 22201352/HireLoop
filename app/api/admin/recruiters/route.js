import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("hireloop");
    const users = db.collection("users");

    const recruiters = await users
      .find({ role: "recruiter" })
      .project({ password: 0 }) // never send password
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, recruiters }, { status: 200 });
  } catch (error) {
    console.error("Fetch recruiters error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}