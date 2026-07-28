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

export async function getInterviewByApplicationId(applicationId) {
  const interviews = await getCollection();
  return interviews.findOne({ applicationId });
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