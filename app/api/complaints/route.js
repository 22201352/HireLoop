import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { createComplaint, getComplaints } from "@/models/Complaint";

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let formData;
    let payload;

    if (contentType.includes("multipart/form-data")) {
      formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      payload = await request.json();
    }

    const {
      complainantId,
      complainantName,
      complainantRole,
      complainantDashboard,
      targetType,
      targetRole,
      targetId,
      targetName,
      category,
      description,
    } = payload;

    if (!complainantId || !complainantName || !complainantRole || !targetType || !targetId || !targetName || !category || !description) {
      return NextResponse.json({ error: "Missing required complaint details" }, { status: 400 });
    }

    let evidenceUrl = payload.evidenceUrl || "";
    const file = formData?.get("evidence") || null;

    if (file && typeof file !== "string") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "hireloop_complaints" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });

      evidenceUrl = uploadResult.secure_url;
    }

    const complaintId = await createComplaint({
      complainantId,
      complainantName,
      complainantRole,
      complainantDashboard: complainantDashboard || complainantRole,
      targetType,
      targetRole,
      targetId,
      targetName,
      category,
      description,
      evidenceUrl,
    });

    return NextResponse.json({ success: true, complaintId }, { status: 201 });
  } catch (error) {
    console.error("Complaint submission error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filedBy = searchParams.get("filedBy");
    const status = searchParams.get("status");

    if (filedBy && status) {
      return NextResponse.json({ error: "Use either filedBy or status, not both" }, { status: 400 });
    }

    const complaints = await getComplaints({ filedBy, status });
    return NextResponse.json({ success: true, complaints }, { status: 200 });
  } catch (error) {
    console.error("Fetch complaints error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
