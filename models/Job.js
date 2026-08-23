import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function getCollection() {
  const client = await clientPromise;
  const db = client.db("hireloop");
  return db.collection("jobs");
}

export async function createJob({
  recruiterId,
  recruiterName,
  companyName,
  title,
  description,
  skills,
  experienceLevel,
  salaryMin,
  salaryMax,
  employmentType,
  applicationDeadline,
}) {
  const jobs = await getCollection();

  const newJob = {
    recruiterId,
    recruiterName,
    companyName,
    title,
    description,
    skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
    experienceLevel,
    salaryMin: Number(salaryMin) || 0,
    salaryMax: Number(salaryMax) || 0,
    employmentType,
    applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
    status: "pending", // pending | approved | rejected
    isOpen: true,
    createdAt: new Date(),
  };

  const result = await jobs.insertOne(newJob);
  return result.insertedId;
}

export async function getJobs({ recruiterId, status } = {}) {
  const jobs = await getCollection();

  const query = {};
  if (recruiterId) query.recruiterId = recruiterId;
  if (status) query.status = status;

  return jobs.find(query).sort({ createdAt: -1 }).toArray();
}

export async function getAllJobsForAdmin() {
  const jobs = await getCollection();
  return jobs.find({}).sort({ createdAt: -1 }).toArray();
}

export async function getJobById(jobId) {
  if (!jobId || !ObjectId.isValid(jobId)) return null;

  const jobs = await getCollection();
  return jobs.findOne({ _id: new ObjectId(jobId) });
}

export async function reviewJob(jobId, action, note) {
  const jobs = await getCollection();
  const newStatus = action === "approve" ? "approved" : "rejected";

  await jobs.updateOne(
    { _id: new ObjectId(jobId) },
    {
      $set: {
        status: newStatus,
        adminNote: note || "",
        reviewedAt: new Date(),
      },
    }
  );
}

export async function toggleJobStatus(jobId, isOpen) {
  const jobs = await getCollection();
  await jobs.updateOne(
    { _id: new ObjectId(jobId) },
    { $set: { isOpen } }
  );
}

export function getMatchedSkills(jobSkills, resumeText) {
  const normalizedText = String(resumeText || '').toLowerCase();
  const skills = Array.isArray(jobSkills) ? jobSkills : [];

  return skills.filter((skill) => {
    const cleanSkill = String(skill).trim().toLowerCase();
    return cleanSkill.length > 1 && normalizedText.includes(cleanSkill);
  });
}

export function getSkillMatchScore(jobSkills, resumeText) {
  const skills = Array.isArray(jobSkills) ? jobSkills : [];
  if (skills.length === 0) return 0;

  return Math.round((getMatchedSkills(skills, resumeText).length / skills.length) * 100);
}

export async function searchApprovedJobs({ keyword, employmentType, experienceLevel, skill, minSalary, sortBy }) {
  const jobs = await getCollection();

  const query = { status: "approved", isOpen: true };

  if (keyword) {
    query.title = { $regex: keyword, $options: "i" };
  }
  if (employmentType) {
    query.employmentType = employmentType;
  }
  if (experienceLevel) {
    query.experienceLevel = experienceLevel;
  }
  if (skill) {
    query.skills = { $regex: skill, $options: "i" };
  }
  if (minSalary) {
    query.salaryMax = { $gte: Number(minSalary) };
  }

  const sortOption = sortBy === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

  return jobs.find(query).sort(sortOption).toArray();
}

export async function getRecommendedJobs(resumeText, limit = 10) {
  const jobs = await getCollection();

  if (!resumeText) return [];

  const approvedJobs = await jobs
    .find({ status: "approved", isOpen: true })
    .toArray();

  const scored = approvedJobs.map((job) => {
    const jobSkills = Array.isArray(job.skills) ? job.skills : [];
    const matchedSkills = getMatchedSkills(jobSkills, resumeText);

    return { ...job, matchedSkills, matchCount: matchedSkills.length };
  });

  return scored
    .filter((job) => job.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, limit);
}