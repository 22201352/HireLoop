import { NextResponse } from "next/server";
import { findUserByEmail, verifyPassword } from "@/models/User";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const passwordMatch = await verifyPassword(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.role === "recruiter" && user.isApproved === false) {
      return NextResponse.json(
        { error: "Your recruiter account is pending admin approval" },
        { status: 403 }
      );
    }

    const { password: _, ...safeUser } = user;

    return NextResponse.json(
      { success: true, message: "Login successful", user: safeUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}