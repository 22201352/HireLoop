import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function getCollection() {
  const client = await clientPromise;
  const db = client.db("hireloop");
  return db.collection("resumes");
}

export async function saveResume({ candidateId, fileUrl, publicId, parsedText }) {
  const resumes = await getCollection();

  // One resume per candidate — replace if they upload a new one
  const existing = await resumes.findOne({ candidateId });

  if (existing) {
    await resumes.updateOne(
      { candidateId },
      {
        $set: {
          fileUrl,
          publicId,
          parsedText,
          updatedAt: new Date(),
        },
      }
    );
    return existing._id;
  }

  const result = await resumes.insertOne({
    candidateId,
    fileUrl,
    publicId,
    parsedText,
    createdAt: new Date(),
  });

  return result.insertedId;
}

export async function getResumeByCandidateId(candidateId) {
  const resumes = await getCollection();
  return resumes.findOne({ candidateId });
}