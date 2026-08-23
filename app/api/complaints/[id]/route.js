import { NextResponse } from "next/server";
import { getJobById, toggleJobStatus } from "@/models/Job";
import { findUserById, flagUserForComplaints, recordComplaintWarning, removeComplaintFlag, suspendUser } from "@/models/User";
import { getComplaintById, updateComplaintResolution } from "@/models/Complaint";
import { sendAccountSuspensionEmail, sendComplaintResolutionEmail, sendComplaintWarningEmail, sendJobRemovalEmail } from "@/lib/email";

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status, adminNote, warningNote, actionTaken } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Complaint id is required" }, { status: 400 });
    }

    if (!status || !["pending", "under_review", "warning_issued", "resolved", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "Invalid complaint status" }, { status: 400 });
    }

    const complaint = await getComplaintById(id);
    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const legacyJobTarget = complaint.targetType === "user"
      ? await getJobById(complaint.targetId)
      : null;
    const targetType = legacyJobTarget ? "job" : complaint.targetType;
    const job = targetType === "job" ? (legacyJobTarget || await getJobById(complaint.targetId)) : null;
    const affectedUser = targetType === "job"
      ? await findUserById(job?.recruiterId)
      : await findUserById(complaint.targetId);
    const validActions = targetType === "job"
      ? ["none", "job_closed", "job_recruiter_warned", "account_flagged", "warning_flag_removed"]
      : ["none", "user_suspended", "user_warned", "account_flagged", "warning_flag_removed"];

    if (!validActions.includes(actionTaken || "none")) {
      return NextResponse.json({ error: "This action is not valid for the complaint target" }, { status: 400 });
    }

    const isWarningAction = actionTaken === "user_warned" || actionTaken === "job_recruiter_warned";
    if (isWarningAction && !String(warningNote || "").trim()) {
      return NextResponse.json({ error: "A reason is required when issuing a warning" }, { status: 400 });
    }

    if (actionTaken === "job_closed" && targetType === "job") {
      await toggleJobStatus(complaint.targetId, false);
      if (affectedUser?.email) {
        try {
          await sendJobRemovalEmail({
            to: affectedUser.email,
            recruiterName: affectedUser.name || "HireLoop recruiter",
            job,
            complaintId: complaint._id.toString(),
            category: complaint.category || "Other",
            adminNote: String(adminNote || "").trim(),
          });
        } catch (emailError) {
          console.error("Job removal email error:", emailError);
        }
      }
    }

    if (actionTaken === "user_suspended" && targetType === "user") {
      await suspendUser(complaint.targetId);
      if (affectedUser?.email) {
        try {
          await sendAccountSuspensionEmail({
            to: affectedUser.email,
            recipientName: affectedUser.name || "HireLoop user",
            complaintId: complaint._id.toString(),
            category: complaint.category || "Other",
            complaintDescription: complaint.description || "No description was provided.",
            adminNote: String(adminNote || "").trim(),
          });
        } catch (emailError) {
          console.error("Account suspension email error:", emailError);
        }
      }
    }

    if (isWarningAction && affectedUser) {
      await recordComplaintWarning(affectedUser._id.toString());
      if (affectedUser.email) {
        await sendComplaintWarningEmail({
          to: affectedUser.email,
          recipientName: affectedUser.name || "HireLoop user",
          category: complaint.category || "Other",
          complaintDescription: complaint.description || "No description was provided.",
          adminNote: String(warningNote || '').trim(),
        });
      }
    }

    if (actionTaken === "account_flagged" && affectedUser) {
      await flagUserForComplaints(affectedUser._id.toString(), complaint._id.toString());
    }

    if (actionTaken === "warning_flag_removed") {
      const updatedUser = affectedUser && await removeComplaintFlag(affectedUser._id.toString(), complaint._id.toString());
      if (!updatedUser) {
        return NextResponse.json({ error: "This account does not have a flag to remove" }, { status: 409 });
      }
    }

    const finalStatus = isWarningAction || actionTaken === "account_flagged" || actionTaken === "warning_flag_removed"
      ? "under_review"
      : status;

    const updatedComplaint = await updateComplaintResolution(id, {
      status: finalStatus,
      adminNote: isWarningAction ? '' : adminNote,
      warningNote: isWarningAction ? warningNote : complaint.warningNote || '',
      actionTaken: actionTaken || complaint.actionTaken || "none",
    });

    const complainantUser = await findUserById(complaint.complainantId);
    if (["resolved", "dismissed"].includes(finalStatus) && complainantUser?.email) {
      await sendComplaintResolutionEmail({
        to: complainantUser.email,
        complainantName: complainantUser.name || complaint.complainantName,
        targetName: complaint.targetName,
        status: finalStatus,
        adminNote: adminNote || complaint.adminNote || "",
      });
    }

    return NextResponse.json({ success: true, complaint: updatedComplaint }, { status: 200 });
  } catch (error) {
    console.error("Complaint resolution error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
