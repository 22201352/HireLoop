import { NextResponse } from "next/server";
import { cancelApplication, updateApplicationStatus } from "@/models/Application";
import { sendStatusUpdateEmail } from "@/lib/email";
import { deleteInterviewByApplicationId } from "@/models/Interview";
import myDatabaseConnection from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const VALID_STATUSES = ["pending", "reviewed", "shortlisted", "rejected"];

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updatedApplication = await updateApplicationStatus(id, status);

    if (!updatedApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    try {
      const client = await myDatabaseConnection;
      const db = client.db("hireloop");
      const candidate = await db.collection("users").findOne({
        _id: new ObjectId(updatedApplication.candidateId),
      });

      if (candidate?.email) {
        await sendStatusUpdateEmail({
          to: candidate.email,
          candidateName: updatedApplication.candidateName,
          jobTitle: updatedApplication.jobTitle,
          companyName: updatedApplication.companyName,
          newStatus: status,
        });
      }
    } catch (emailError) {
      console.error("Failed to send status update email:", emailError);
    }

    return NextResponse.json(
      { success: true, application: updatedApplication },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { candidateId } = await request.json();

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
    }

    const cancelledApplication = await cancelApplication(params.id, candidateId);

    if (!cancelledApplication) {
      return NextResponse.json(
        { error: "Application cannot be cancelled" },
        { status: 409 }
      );
    }

    await deleteInterviewByApplicationId(params.id);

    return NextResponse.json(
      {
        success: true,
        applicationId: String(cancelledApplication._id),
        status: cancelledApplication.status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cancel application error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}