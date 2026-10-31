import OpenAI from "openai";
import { z } from "zod";

const DecisionSchema = z.object({
  decision: z.enum(["yes", "no"]),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().min(1).max(400),
});

export type AiDecision = z.infer<typeof DecisionSchema> & {
  source: "openai" | "mock";
};

function mockDecision(prompt: string): AiDecision {
  // Deterministic-ish mock from prompt hash so demos feel stable per prompt.
  let hash = 0;
  for (let i = 0; i < prompt.length; i += 1) {
    hash = (hash * 31 + prompt.charCodeAt(i)) >>> 0;
  }
  const confidence = 35 + (hash % 56); // 35–90
  const decision = hash % 2 === 0 ? "yes" : "no";
  return {
    decision,
    confidence,
    reasoning:
      "Mock mode (no OPENAI_API_KEY). A stand-in confidence score was generated for local play.",
    source: "mock",
  };
}

export async function getDecisionConfidence(prompt: string): Promise<AiDecision> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return mockDecision(prompt);
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are deciding yes/no dilemmas for a party game.",
            "Respond with JSON only: {\"decision\":\"yes\"|\"no\",\"confidence\":0-100,\"reasoning\":\"short\"}.",
            "confidence is how sure you are of your decision (0 = pure coin flip, 100 = absolutely certain).",
            "Be decisive but honest about uncertainty. Keep reasoning under 40 words.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Decide this dilemma:\n\n${prompt}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const parsed = DecisionSchema.parse(JSON.parse(raw));
    return {
      ...parsed,
      confidence: Math.round(parsed.confidence),
      source: "openai",
    };
  } catch (error) {
    console.error("OpenAI decision failed, falling back to mock:", error);
    return mockDecision(prompt);
  }
}
