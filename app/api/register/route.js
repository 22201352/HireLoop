import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, role, companyName, designation, businessEmail } = body;

    // Basic validation
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (role === "recruiter" && (!companyName || !designation || !businessEmail)) {
      return NextResponse.json(
        { error: "Company name, designation, and business email are required for recruiters" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("hireloop");
    const users = db.collection("users");

    // Check if email already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build user document
    const newUser = {
      name,
      email,
      phone,
      password: hashedPassword,
      role, // "candidate" or "recruiter"
      createdAt: new Date(),
    };

    if (role === "recruiter") {
      newUser.companyName = companyName;
      newUser.designation = designation;
      newUser.businessEmail = businessEmail;
      newUser.isApproved = false; // Admin must approve recruiters
    }

    const result = await users.insertOne(newUser);

    return NextResponse.json(
      { success: true, message: "Registration successful", userId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}