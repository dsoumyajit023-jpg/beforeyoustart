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
  return raw.trim().slice(0, MAX_QUESTION_LENGTH).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
}

function validateResponse(parsed) {
  if (typeof parsed !== "object" || parsed === null) return false;
  if (typeof parsed.category !== "string") return false;
  if (typeof parsed.realityScore !== "number" || parsed.realityScore < 10 || parsed.realityScore > 90) return false;
  if (typeof parsed.verdict !== "string") return false;
  if (!Array.isArray(parsed.challenges)) return false;
  if (!Array.isArray(parsed.opportunities)) return false;
  if (typeof parsed.requirements !== "object" || parsed.requirements === null) return false;
  if (!Array.isArray(parsed.plan)) return false;
  if (typeof parsed.mindset !== "string") return false;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", status: 405 });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
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
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Service temporarily unavailable.", status: 500 });

  const DEPTH_PROMPT = {
    quick: "Concise: 3-4 challenges, 2 opportunities. Brief descriptions.",
    standard: "Thorough: 5-6 challenges, 3-4 opportunities, full details.",
    deep: "Deep: 7-8 challenges, 4-5 opportunities, detailed plan.",
  };

  const systemPrompt = `You are BeforeUstart — a brutally honest AI reality check tool. Be specific, concrete, honest. No sugarcoating. Like a wise friend who tells it like it is. Detect user intent and scope your response to what genuinely helps. Respond ONLY with valid JSON, no markdown, no backticks.`;

  const userPrompt = `Reality check request: """${question}"""

${DEPTH_PROMPT[depth]}

Detect: Is this educational/learning? Business? Tech/build? Health? Creative? Life decision?

Return this exact JSON (no extras):
{
  "category": "business|creative|tech|health|social|learning|other",
  "categoryEmoji": "single emoji",
  "isEducational": true|false,
  "intent": "learn_skill|start_business|build_product|get_fit|create_content|career_change|life_decision|social_growth|other",
  "intentLabel": "3-5 word label",
  "realityScore": <10-90>,
  "scoreLabel": "short honest label",
  "verdict": "one specific honest sentence",
  "timeToCompetence": "e.g. 3-6 months to basics OR null if not a learning goal",
  "challenges": [{"title":"","detail":"","severity":"high|medium|low"}],
  "opportunities": [{"title":"","detail":""}],
  "requirements": {"time":"X hrs/week","money":"$X or Minimal","skills":["skill1"]},
  "skillBreakdown": [{"skill":"","difficulty":1-10,"timeWeeks":1-52,"description":""}],
  "plan": [{"phase":"Days 1-7","focus":"","action":""},{"phase":"Days 8-21","focus":"","action":""},{"phase":"Days 22-30","focus":"","action":""}],
  "mindset": "2-3 sentences",
  "successFactors": ["","",""],
  "redFlags": ["",""],
  "resources": {
    "books": [{"title":"","author":"","why":"","url":"https://... or null"}],
    "courses": [{"name":"","platform":"","url":"https://... or null","free":true,"why":""}],
    "apps": [{"name":"","purpose":"","url":"https://... or null","free":true}],
    "websites": [{"name":"","url":"https://...","why":""}],
    "communities": [{"name":"","platform":"Reddit|Discord|other","url":"https://... or null","why":""}]
  }
}

RESOURCES RULES:
- Learning/educational goals: 2-3 books, 3-4 courses, 2-3 apps, 3-4 websites, 2 communities
- Business goals: 1-2 books, 2-3 websites, skip courses unless vital
- Health/fitness: 1-2 books, 2-3 apps, 1-2 websites, no courses
- Creative work: 1-2 books, 2-3 apps, 2 websites, 2 communities
- Quick depth: minimal resources only
- skillBreakdown: only if skill-learning is central (max 5 skills), else empty array []
- All URLs must be real. Use null if unsure.`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 2500,
        temperature: 0.65,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      }),
    });

    if (!groqRes.ok) {
      await groqRes.text();
      return res.status(502).json({ error: "AI service error. Please try again.", status: 502 });
    }

    const data = await groqRes.json();
    const raw = data.choices?.[0]?.message?.content || "";
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
