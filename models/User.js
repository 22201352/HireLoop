import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

async function getCollection() {
  const client = await clientPromise;
  const db = client.db("hireloop");
  return db.collection("users");
}

export async function createUser({ name, email, phone, password, role, companyName, designation, businessEmail }) {
  const users = await getCollection();

  const existingUser = await users.findOne({ email });
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    name,
    email,
    phone,
    password: hashedPassword,
    role,
    createdAt: new Date(),
  };

  if (role === "recruiter") {
    newUser.companyName = companyName;
    newUser.designation = designation;
    newUser.businessEmail = businessEmail;
    newUser.isApproved = false;
  }

  const result = await users.insertOne(newUser);
  return result.insertedId;
}

export async function findUserByEmail(email) {
  const users = await getCollection();
  return users.findOne({ email });
}

export async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function getRecruiters() {
  const users = await getCollection();
  return users
    .find({ role: "recruiter" })
    .project({ password: 0 })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function updateRecruiterApproval(userId, action) {
  const users = await getCollection();

  if (action === "approve") {
    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isApproved: true } }
    );
  } else if (action === "reject") {
    await users.deleteOne({ _id: new ObjectId(userId) });
  } else {
    throw new Error("Invalid action");
  }
}