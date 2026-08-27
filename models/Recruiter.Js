import myDatabaseConnection from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function getCollection() {
  const client = await myDatabaseConnection;
  const db = client.db("hireloop");
  return db.collection("users");
}

export async function getRecruiterProfile(recruiterId) {
  const users = await getCollection();
  return users.findOne(
    { _id: new ObjectId(recruiterId), role: "recruiter" },
    { projection: { password: 0 } }
  );
}

export async function updateRecruiterProfile(recruiterId, updates) {
  const users = await getCollection();

  const allowedFields = [
    "name", "phone", "designation", "businessEmail",
    "companyName", "industry", "website", "description",
  ];
  const setFields = { updatedAt: new Date() };
  for (const field of allowedFields) {
    if (updates[field] !== undefined) setFields[field] = updates[field];
  }

  const result = await users.findOneAndUpdate(
    { _id: new ObjectId(recruiterId), role: "recruiter" },
    { $set: setFields },
    { returnDocument: "after", projection: { password: 0 } }
  );
  return result;
}