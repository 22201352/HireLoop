import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

function fallbackSummary(description) {
  const firstSentence = String(description || "").split(/[.!?]/)[0].trim();
  return (firstSentence || "No description provided").slice(0, 180);
}

export async function POST(request) {
  try {
    const { description, category } = await request.json();
    if (!description) return NextResponse.json({ summary: fallbackSummary(description) });

    const prompt = `Summarize this recruitment platform complaint in one neutral sentence of at most 18 words. Include the main allegation and affected target. Do not invent facts. Do not begin with or repeat the category keyword. Category: ${category || "Other"}. Description: ${description}`;

    if (process.env.ENABLE_AI_SUMMARIES === "true" && process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
        const result = await model.generateContent(prompt);
        const summary = result.response.text().trim().replace(/^[-*]\s*/, "");
        if (summary) return NextResponse.json({ summary, generated: true });
      } catch (error) {
        console.error("Gemini complaint summary error:", error);
      }
    }

    if (process.env.ENABLE_AI_SUMMARIES === "true" && process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const result = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 60,
          temperature: 0.1,
        });
        const summary = result.choices?.[0]?.message?.content?.trim().replace(/^[-*]\s*/, "");
        if (summary) return NextResponse.json({ summary, generated: true });
      } catch (error) {
        console.error("Groq complaint summary error:", error);
      }
    }

    return NextResponse.json({ summary: fallbackSummary(description), generated: false });
  } catch (error) {
    console.error("Complaint summary error:", error);
    return NextResponse.json({ summary: fallbackSummary(description), generated: false });
  }
}