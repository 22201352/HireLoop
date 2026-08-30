import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import groq from "@/lib/groq";
import { getSkillMatchScore } from "@/models/Job";

async function getCollection() {
  const client = await clientPromise;
  const db = client.db("hireloop");
  return db.collection("applications");
}

// Check if candidate already applied to this job
export async function hasApplied(candidateId, jobId) {
  const applications = await getCollection();
  const existing = await applications.findOne({
    candidateId,
    jobId,
    status: { $ne: "cancelled" },
  });
  return !!existing;
}

// Run AI Resume Scoring using Groq (Feature #6)
async function getAIScore(jobDescription, resumeText, jobSkills) {
  const skillMatchScore = getSkillMatchScore(jobSkills, resumeText);

  try {
    const prompt = `You are a recruitment assistant. Compare the candidate's resume text to the job description below.

Job Description:
"""${jobDescription}"""

Candidate Resume Text:
"""${resumeText.slice(0, 6000)}"""

Return ONLY a valid JSON object with this exact format, no other text:
{"score": <number between 0 and 100>, "justification": "<one short sentence explaining the score>"}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
    });

    const responseText = completion.choices[0].message.content.trim();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

    // Use Groq's own score, but validate it — LLM output isn't guaranteed
    // to be a clean 0-100 number. Fall back to the keyword-match score
    // if it's missing or out of range.
    const rawScore = Number(parsed.score);
    const isValidScore = Number.isFinite(rawScore) && rawScore >= 0 && rawScore <= 100;
    const score = isValidScore ? Math.round(rawScore) : skillMatchScore;

    return {
      score,
      justification: parsed.justification || "No justification provided.",
    };
  } catch (error) {
    console.error("AI scoring error:", error);
    return {
      score: skillMatchScore,
      justification: "Match score based on required skills found in your resume.",
    };
  }
}

// Create a new application (Feature #5) + trigger AI scoring (Feature #6)
export async function createApplication({ candidateId, candidateName, jobId, jobTitle, companyName, recruiterId, jobDescription, jobSkills, resumeText, resumeUrl }) {
  const applications = await getCollection();

  const alreadyApplied = await hasApplied(candidateId, jobId);
  if (alreadyApplied) {
    throw new Error("You have already applied to this job");
  }

  const aiResult = await getAIScore(jobDescription, resumeText, jobSkills);

  const newApplication = {
    candidateId,
    candidateName,
    jobId,
    jobTitle,
    companyName,
    recruiterId,
    resumeUrl,
    aiScore: aiResult.score,
    aiJustification: aiResult.justification,
    status: "pending",
    submittedAt: new Date(),
  };

  const result = await applications.insertOne(newApplication);
  return { applicationId: result.insertedId, aiScore: aiResult.score, aiJustification: aiResult.justification };
}

export async function getApplicationsByCandidateId(candidateId) {
  const applications = await getCollection();
  return applications
    .find({
      candidateId,
      $or: [
        { status: { $ne: "cancelled" } },
        { cancellationAfterApproval: true },
      ],
    })
    .sort({ submittedAt: -1 })
    .toArray();
}

export async function getApplicationsWithJobDetails(candidateId) {
  const applications = await getCollection();

  const results = await applications.aggregate([
    {
      $match: {
        candidateId,
        $or: [
          { status: { $ne: "cancelled" } },
          { cancellationAfterApproval: true },
        ],
      },
    },
    {
      $lookup: {
        from: "jobs",
        let: { jobIdStr: "$jobId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$jobIdStr" }] } } }
        ],
        as: "jobDetails",
      },
    },
    { $sort: { submittedAt: -1 } },
  ]).toArray();

  return results;
}

export async function getApplicationsByJobId(jobId) {
  const applications = await getCollection();
  return applications
    .find({
      jobId,
      $or: [
        { status: { $ne: "cancelled" } },
        { cancellationAfterApproval: true },
      ],
    })
    .sort({ aiScore: -1 })
    .toArray();
}

export async function updateApplicationSkillScore(applicationId, jobSkills, resumeText) {
  const applications = await getCollection();
  const score = getSkillMatchScore(jobSkills, resumeText);

  const result = await applications.findOneAndUpdate(
    { _id: new ObjectId(applicationId) },
    {
      $set: {
        aiScore: score,
        aiJustification: "Match score based on required skills found in the candidate's resume.",
      },
    },
    { returnDocument: "after" }
  );

  return result;
}

export async function updateApplicationStatus(applicationId, newStatus) {
  const applications = await getCollection();

  const result = await applications.findOneAndUpdate(
    { _id: new ObjectId(applicationId) },
    { $set: { status: newStatus, statusUpdatedAt: new Date() } },
    { returnDocument: "after" }
  );

  return result;
}

export async function cancelApplication(applicationId, candidateId) {
  const applications = await getCollection();

  const application = await applications.findOne({
    _id: new ObjectId(applicationId),
    candidateId,
    status: { $in: ["pending", "reviewed", "shortlisted"] },
  });

  if (!application) return null;

  if (application.status === "shortlisted") {
    const result = await applications.findOneAndUpdate(
      { _id: application._id },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancellationAfterApproval: true,
        },
      },
      { returnDocument: "after" }
    );
    return result?.value ?? result;
  }

  const result = await applications.findOneAndDelete({ _id: application._id });
  return result?.value ?? result;
}

export async function getRecruiterApplicationStats(recruiterId) {
  const applications = await getCollection();

  const results = await applications.aggregate([
    {
      $match: {
        recruiterId,
        $or: [
          { status: { $ne: "cancelled" } },
          { cancellationAfterApproval: true },
        ],
      },
    },
    {
      $group: {
        _id: null,
        totalApplicants: { $sum: 1 },
        shortlisted: {
          $sum: { $cond: [{ $eq: ["$status", "shortlisted"] }, 1, 0] },
        },
      },
    },
  ]).toArray();

  return results[0]
    ? { totalApplicants: results[0].totalApplicants, shortlisted: results[0].shortlisted }
    : { totalApplicants: 0, shortlisted: 0 };
}

export async function getAdminApplicationStats() {
  const applications = await getCollection();

  const results = await applications.aggregate([
    {
      $group: {
        _id: null,
        totalProcessed: { $sum: 1 },
        aiScored: {
          $sum: { $cond: [{ $ifNull: ["$aiScore", false] }, 1, 0] },
        },
        avgAiScore: { $avg: "$aiScore" },
      },
    },
  ]).toArray();

  return results[0]
    ? {
        totalProcessed: results[0].totalProcessed,
        aiScored: results[0].aiScored,
        avgAiScore: Math.round(results[0].avgAiScore || 0),
      }
    : { totalProcessed: 0, aiScored: 0, avgAiScore: 0 };
}