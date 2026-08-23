import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function getCollection() {
  const client = await clientPromise;
  const db = client.db("hireloop");
  return db.collection("complaints");
}

async function getUsersCollection() {
  const client = await clientPromise;
  const db = client.db("hireloop");
  return db.collection("users");
}

async function getJobsCollection() {
  const client = await clientPromise;
  const db = client.db("hireloop");
  return db.collection("jobs");
}

export async function createComplaint({
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
  evidenceUrl,
}) {
  const complaints = await getCollection();

  const complaint = {
    complainantId,
    complainantName,
    complainantRole,
    complainantDashboard: complainantDashboard || complainantRole,
    targetType,
    targetRole: targetRole || (targetType === "job" ? "job" : ""),
    targetId,
    targetName,
    category,
    description,
    evidenceUrl: evidenceUrl || "",
    status: "pending",
    actionTaken: "none",
    adminNote: "",
    createdAt: new Date(),
  };

  const result = await complaints.insertOne(complaint);
  return result.insertedId.toString();
}

export async function getComplaints({ filedBy, status } = {}) {
  const complaints = await getCollection();
  const query = {};

  if (filedBy) query.complainantId = filedBy;
  if (status) query.status = status === "pending" ? { $in: ["pending", "under_review"] } : status;

  const records = await complaints.find(query).sort({ createdAt: -1 }).toArray();
  const users = await getUsersCollection();
  const jobs = await getJobsCollection();

  return Promise.all(records.map(async (complaint) => {
    if (complaint.targetType !== "user" || (complaint.targetRole && complaint.targetRole !== "user")) return complaint;

    const targetUser = ObjectId.isValid(complaint.targetId)
      ? await users.findOne({ _id: new ObjectId(complaint.targetId) }, { projection: { role: 1 } })
      : null;

    if (targetUser) return { ...complaint, targetRole: targetUser.role || "user" };

    const legacyJob = ObjectId.isValid(complaint.targetId)
      ? await jobs.findOne({ _id: new ObjectId(complaint.targetId) }, { projection: { _id: 1 } })
      : null;

    return legacyJob
      ? { ...complaint, targetType: "job", targetRole: "job" }
      : { ...complaint, targetRole: "user" };
  }));
}

export async function getComplaintById(complaintId) {
  const complaints = await getCollection();

  if (!complaintId) return null;

  return complaints.findOne({ _id: new ObjectId(complaintId) });
}

export async function updateComplaintResolution(complaintId, { status, adminNote, warningNote, actionTaken }) {
  const complaints = await getCollection();

  const update = {
    status,
    adminNote: adminNote || "",
    warningNote: warningNote || "",
    actionTaken: actionTaken || "none",
    resolvedAt: new Date(),
  };

  const result = await complaints.findOneAndUpdate(
    { _id: new ObjectId(complaintId) },
    { $set: update },
    { returnDocument: "after" }
  );

  return result.value;
}
