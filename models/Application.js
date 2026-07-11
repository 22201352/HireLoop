import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import groq from "@/lib/groq";

async function getCollection() {
  const client = await clientPromise;
  const db = client.db("hireloop");
  return db.collection("applications");
}

// Check if candidate already applied to this job
export async function hasApplied(candidateId, jobId) {
  const applications = await getCollection();
  const existing = await applications.findOne({ candidateId, jobId });
  return !!existing;
}

// Run AI Resume Scoring using Groq (Feature #6)
async function getAIScore(jobDescription, resumeText) {
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

    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      justification: parsed.justification || "No justification provided.",
    };
  } catch (error) {
    console.error("AI scoring error:", error);
    return { score: 0, justification: "AI scoring unavailable at this time." };
  }
}

// Create a new application (Feature #5) + trigger AI scoring (Feature #6)
export async function createApplication({ candidateId, candidateName, jobId, jobTitle, companyName, recruiterId, jobDescription, resumeText, resumeUrl }) {
  const applications = await getCollection();

  const alreadyApplied = await hasApplied(candidateId, jobId);
  if (alreadyApplied) {
    throw new Error("You have already applied to this job");
  }

  const aiResult = await getAIScore(jobDescription, resumeText);

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
  return applications.find({ candidateId }).sort({ submittedAt: -1 }).toArray();
}

export async function getApplicationsByJobId(jobId) {
  const applications = await getCollection();
  return applications.find({ jobId }).sort({ aiScore: -1 }).toArray();
}

export async function updateApplicationStatus(applicationId, newStatus) {
  const applications = await getCollection();
  const application = await applications.findOne({ _id: new ObjectId(applicationId) });

  await applications.updateOne(
    { _id: new ObjectId(applicationId) },
    { $set: { status: newStatus, statusUpdatedAt: new Date() } }
  );

  return application;
}