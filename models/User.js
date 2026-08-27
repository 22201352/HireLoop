import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

async function getCollection() {
  const client = await clientPromise;
  const db = client.db("hireloop");
  return db.collection("users");
}

async function getSuspendedIdentitiesCollection() {
  const client = await clientPromise;
  return client.db("hireloop").collection("suspendedIdentities");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function getIdentityKeys({ email, phone, businessEmail }) {
  return [normalizeEmail(email), normalizePhone(phone), normalizeEmail(businessEmail)].filter(Boolean);
}

export async function createUser({ name, email, phone, password, role, companyName, designation, businessEmail }) {
  const users = await getCollection();
  const suspendedIdentities = await getSuspendedIdentitiesCollection();

  email = normalizeEmail(email);
  phone = normalizePhone(phone);
  businessEmail = normalizeEmail(businessEmail);
  const identityKeys = getIdentityKeys({ email, phone, businessEmail });

  if (await suspendedIdentities.findOne({ identity: { $in: identityKeys } })) {
    throw new Error("Registration blocked for a suspended account");
  }

  const identityMatches = [{ email }, { phone }];
  if (role === "recruiter" && businessEmail) identityMatches.push({ businessEmail });

  const existingUser = await users.findOne({ $or: identityMatches });
  if (existingUser) {
    if (existingUser.isSuspended) {
      throw new Error("Registration blocked for a suspended account");
    }
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    name,
    email,
    phone,
    password: hashedPassword,
    role,
    isSuspended: false,
    complaintWarnings: 0,
    complaintFlags: 0,
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
  return users.findOne({ email: normalizeEmail(email) });
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

export async function findUserById(userId) {
  const users = await getCollection();
  return users.findOne({ _id: new ObjectId(userId) });
}

export async function findRecruiterById(userId) {
  if (!userId || !ObjectId.isValid(userId)) return null;

  const users = await getCollection();
  return users.findOne(
    { _id: new ObjectId(userId), role: "recruiter" },
    { projection: { password: 0 } }
  );
}

export async function findUserForAdmin(userId) {
  if (!userId || !ObjectId.isValid(userId)) return null;

  const users = await getCollection();
  return users.findOne(
    { _id: new ObjectId(userId) },
    { projection: { password: 0 } }
  );
}

export async function suspendUser(userId) {
  if (!userId || !ObjectId.isValid(userId)) return null;

  const users = await getCollection();
  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user) return null;

  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { isSuspended: true, suspendedAt: new Date() } }
  );

  const identityKeys = getIdentityKeys(user);
  if (identityKeys.length) {
    const suspendedIdentities = await getSuspendedIdentitiesCollection();
    await suspendedIdentities.bulkWrite(identityKeys.map((identity) => ({
      updateOne: {
        filter: { identity },
        update: { $set: { identity, userId: user._id.toString(), suspendedAt: new Date() } },
        upsert: true,
      },
    })));
  }

  return user;
}

export async function recordComplaintWarning(userId) {
  const users = await getCollection();
  const result = await users.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $inc: { complaintWarnings: 1 }, $set: { lastComplaintWarningAt: new Date() } },
    { returnDocument: "after", projection: { password: 0 } }
  );
  return result.value;
}

export async function flagUserForComplaints(userId, complaintId) {
  const users = await getCollection();
  const result = await users.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    {
      $inc: { complaintFlags: 1 },
      $set: { isComplaintFlagged: true, lastComplaintFlaggedAt: new Date() },
      $push: {
        complaintFlagRecords: {
          complaintId: String(complaintId || ""),
          source: "admin",
          createdAt: new Date(),
          removedAt: null,
        },
      },
    },
    { returnDocument: "after", projection: { password: 0 } }
  );
  return result.value;
}

export async function removeComplaintFlag(userId, complaintId) {
  const users = await getCollection();
  const existingUser = await users.findOne({ _id: new ObjectId(userId) });
  if (!existingUser || !existingUser.complaintFlags) return null;

  const activeFlagIndex = (existingUser.complaintFlagRecords || []).findIndex(
    (flag) => flag.complaintId === String(complaintId) && !flag.removedAt
  );
  const update = activeFlagIndex >= 0
    ? {
        $inc: { complaintFlags: -1 },
        $set: {
          [`complaintFlagRecords.${activeFlagIndex}.removedAt`]: new Date(),
          lastComplaintFlagRemovedAt: new Date(),
        },
      }
    : {
        // Legacy flags were stored only as a count. Remove one, never all of them.
        $inc: { complaintFlags: -1 },
        $set: { lastComplaintFlagRemovedAt: new Date() },
      };
  const result = await users.findOneAndUpdate(
    { _id: new ObjectId(userId), complaintFlags: { $gt: 0 } },
    update,
    { returnDocument: "after", projection: { password: 0 } }
  );
  const user = result?.value ?? result;
  if (!user) return null;

  if (!user.complaintFlags) {
    await users.updateOne({ _id: user._id }, { $set: { isComplaintFlagged: false } });
    user.isComplaintFlagged = false;
  }

  return user;
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
export async function updateRecruiterProfile(userId, updates) {
  if (!userId || !ObjectId.isValid(userId)) return null;

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
    { _id: new ObjectId(userId), role: "recruiter" },
    { $set: setFields },
    { returnDocument: "after", projection: { password: 0 } }
  );
  return result.value ?? result;
}
export async function getAllUsersForAdmin() {
  const users = await getCollection();
  return users
    .find({}, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getAdminUserStats() {
  const users = await getCollection();
  const results = await users.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]).toArray();

  const stats = { candidate: 0, recruiter: 0, admin: 0 };
  results.forEach((r) => {
    if (r._id) stats[r._id] = r.count;
  });
  return stats;
}