import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { userId, action } = await request.json(); // action: "approve" or "reject"

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("hireloop");
    const users = db.collection("users");

    if (action === "approve") {
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { isApproved: true } }
      );
    } else if (action === "reject") {
      await users.deleteOne({ _id: new ObjectId(userId) });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Approve recruiter error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}