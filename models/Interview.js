import myDatabaseConnection from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function getCollection() {
  const client = await myDatabaseConnection;
  const db = client.db("hireloop");
  return db.collection("interviews");
}

export async function proposeInterview({ applicationId, candidateId, candidateName, recruiterId, jobTitle, companyName, proposedSlots }) {
  const interviews = await getCollection();

  const newInterview = {
    applicationId,
    candidateId,
    candidateName,
    recruiterId,
    jobTitle,
    companyName,
    proposedSlots,
    confirmedSlot: null,
    status: "proposed",
    createdAt: new Date(),
    confirmedAt: null,
  };

  const result = await interviews.insertOne(newInterview);
  return result.insertedId;
}

export async function getInterviewsByCandidateId(candidateId) {
  const interviews = await getCollection();
  return interviews.find({ candidateId }).sort({ createdAt: -1 }).toArray();
}

export async function getActiveInterviewsByCandidateId(candidateId) {
  const client = await myDatabaseConnection;
  const db = client.db("hireloop");
  const activeApplications = await db.collection("applications").find({
    candidateId,
    status: { $ne: "cancelled" },
  }).project({ _id: 1 }).toArray();

  const activeApplicationIds = new Set(activeApplications.map((application) => String(application._id)));
  const candidateInterviews = await getInterviewsByCandidateId(candidateId);

  return candidateInterviews.filter((interview) =>
    activeApplicationIds.has(String(interview.applicationId))
  );
}

export async function getInterviewByApplicationId(applicationId) {
  const interviews = await getCollection();
  return interviews.findOne({ applicationId });
}

export async function deleteInterviewByApplicationId(applicationId) {
  const interviews = await getCollection();
  const applicationIds = [String(applicationId)];

  if (ObjectId.isValid(applicationId)) {
    applicationIds.push(new ObjectId(applicationId));
  }

  return interviews.deleteMany({ applicationId: { $in: applicationIds } });
}

export async function confirmInterviewSlot(interviewId, selectedSlot) {
  const interviews = await getCollection();

  const result = await interviews.findOneAndUpdate(
    { _id: new ObjectId(interviewId) },
    { $set: { confirmedSlot: selectedSlot, status: "confirmed", confirmedAt: new Date() } },
    { returnDocument: "after" }
  );

  return result;
}
export async function getInterviewsByRecruiterId(recruiterId) {
  const interviews = await getCollection();
  return interviews.find({ recruiterId }).sort({ createdAt: -1 }).toArray();
}