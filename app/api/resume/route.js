import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { saveResume, getResumeByCandidateId } from "@/models/Resume";
import pdfParse from "pdf-parse";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");
    const candidateId = formData.get("candidateId");

    if (!file || !candidateId) {
      return NextResponse.json({ error: "Resume file and candidateId are required" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = await pdfParse(buffer);
    const parsedText = parsed.text;

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "raw", folder: "hireloop_resumes", format: "pdf" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    const resumeId = await saveResume({
      candidateId,
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      parsedText,
    });

    return NextResponse.json(
      { success: true, message: "Resume uploaded and parsed successfully", resumeId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get("candidateId");

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
    }

    const resume = await getResumeByCandidateId(candidateId);

    return NextResponse.json({ success: true, resume: resume || null }, { status: 200 });
  } catch (error) {
    console.error("Fetch resume error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}