const ALLOWED_DEPTHS = new Set(["quick", "standard", "deep"]);
const MAX_QUESTION_LENGTH = 600;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

const rateLimitMap = new Map();

function getRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  rateLimitMap.get(ip) ? Object.assign(rateLimitMap.get(ip), entry) : rateLimitMap.set(ip, entry);
  if (rateLimitMap.size > 10_000) {
    const oldest = [...rateLimitMap.entries()]
      .sort((a, b) => a[1].windowStart - b[1].windowStart)
      .slice(0, 1000);
    oldest.forEach(([k]) => rateLimitMap.delete(k));
  }
  return entry.count;
}

function sanitiseQuestion(raw) {
  return raw
    .trim()
    .slice(0, MAX_QUESTION_LENGTH)
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
}

function validateResponse(parsed) {
  const VALID_CATEGORIES = new Set(["business", "creative", "tech", "health", "social", "learning", "other"]);
  const VALID_SEVERITIES = new Set(["high", "medium", "low"]);
  if (typeof parsed !== "object" || parsed === null) return false;
  if (!VALID_CATEGORIES.has(parsed.category)) return false;
  if (typeof parsed.categoryEmoji !== "string") return false;
  if (typeof parsed.realityScore !== "number" || parsed.realityScore < 10 || parsed.realityScore > 90) return false;
  if (typeof parsed.scoreLabel !== "string") return false;
  if (typeof parsed.verdict !== "string") return false;
  if (!Array.isArray(parsed.challenges)) return false;
  for (const c of parsed.challenges) {
    if (typeof c.title !== "string" || typeof c.detail !== "string") return false;
    if (!VALID_SEVERITIES.has(c.severity)) return false;
  }
  if (!Array.isArray(parsed.opportunities)) return false;
  if (typeof parsed.requirements !== "object" || parsed.requirements === null) return false;
  if (!Array.isArray(parsed.plan)) return false;
  if (typeof parsed.mindset !== "string") return false;
  if (!Array.isArray(parsed.successFactors)) return false;
  if (!Array.isArray(parsed.redFlags)) return false;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", status: 405 });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const requestCount = getRateLimit(ip);
  if (requestCount > RATE_LIMIT_MAX) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Too many requests. Please wait a minute and try again.", status: 429 });
  }

  const { question: rawQuestion, depth: rawDepth } = req.body || {};

  if (!rawQuestion || typeof rawQuestion !== "string" || rawQuestion.trim().length < 5) {
    return res.status(400).json({ error: "A valid question is required (minimum 5 characters).", status: 400 });
  }

  const depth = ALLOWED_DEPTHS.has(rawDepth) ? rawDepth : "standard";
  const question = sanitiseQuestion(rawQuestion);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Service temporarily unavailable.", status: 500 });
  }

  const DEPTH_PROMPT = {
    quick: "Concise check: 3-4 challenges, 2 opportunities.",
    standard: "Thorough check: 5-6 challenges, 3-4 opportunities, full details.",
    deep: "Deep analysis: 7-8 challenges, 4-5 opportunities, detailed plan and requirements.",
  };

  const depthInstruction = DEPTH_PROMPT[depth];

  const prompt = `You are BeforeUstart — a brutally honest AI reality check tool. User wants to know about: """${question}"""

${depthInstruction}

Be specific, concrete, and honest. No sugarcoating. No motivation speeches. Like a wise experienced friend who tells it like it is.

Respond ONLY with a valid JSON object, no markdown, no backticks:
{
  "category": "business|creative|tech|health|social|learning|other",
  "categoryEmoji": "single emoji",
  "realityScore": <10-90, where 10=extremely hard/risky, 90=fairly straightforward>,
  "scoreLabel": "concise honest label e.g. 'Harder than it looks'",
  "verdict": "One specific honest sentence about this exact endeavor",
  "challenges": [{"title":"short title","detail":"2-3 honest sentences","severity":"high|medium|low"}],
  "opportunities": [{"title":"short title","detail":"1-2 sentences on real upside"}],
  "requirements": {"time":"X-Y hrs/week","money":"$X-$Y or Minimal","skills":["skill1","skill2","skill3"]},
  "plan": [
    {"phase":"Days 1-7","focus":"Focus area","action":"Concrete specific action"},
    {"phase":"Days 8-21","focus":"Focus area","action":"Concrete specific action"},
    {"phase":"Days 22-30","focus":"Focus area","action":"Concrete specific action"}
  ],
  "mindset": "2-3 sentences on the essential mindset shift required",
  "successFactors": ["factor1","factor2","factor3"],
  "redFlags": ["flag1","flag2"]
}`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      await anthropicRes.text();
      return res.status(502).json({ error: "AI service error. Please try again.", status: 502 });
    }

    const data = await anthropicRes.json();
    const raw = data.content?.[0]?.text || "";
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);

    if (!validateResponse(parsed)) {
      return res.status(502).json({ error: "Unexpected response from AI. Please try again.", status: 502 });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong. Please try again.", status: 500 });
  }
}
