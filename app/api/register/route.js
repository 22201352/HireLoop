import { NextResponse } from "next/server";
import { createUser } from "@/models/User";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, role, companyName, designation, businessEmail } = body;

    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (role === "recruiter" && (!companyName || !designation || !businessEmail)) {
      return NextResponse.json(
        { error: "Company name, designation, and business email are required for recruiters" },
        { status: 400 }
      );
    }

    const userId = await createUser({ name, email, phone, password, role, companyName, designation, businessEmail });

    return NextResponse.json(
      { success: true, message: "Registration successful", userId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    if (error.message === "Email already registered") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}