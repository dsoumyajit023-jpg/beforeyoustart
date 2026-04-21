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

  const { question: rawQuestion, depth: rawDepth, userContext, isFreeIntent } = req.body || {};
  if (!rawQuestion || typeof rawQuestion !== "string" || rawQuestion.trim().length < 5) {
    return res.status(400).json({ error: "A valid question is required (minimum 5 characters).", status: 400 });
  }

  const depth = ALLOWED_DEPTHS.has(rawDepth) ? rawDepth : "standard";
  const question = sanitiseQuestion(rawQuestion);
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Service temporarily unavailable.", status: 500 });

  const currency = userContext?.currency || "USD";
  const currencySymbol = userContext?.symbol || "$";
  const country = userContext?.country || "Global";
  const locale = userContext?.locale || "en-US";

  const DEPTH_CONFIG = {
    quick:    { challenges: "3-4", opportunities: "2",   plan: 3, stats: 2, videos: 2 },
    standard: { challenges: "5-6", opportunities: "3-4", plan: 4, stats: 3, videos: 3 },
    deep:     { challenges: "7-8", opportunities: "4-5", plan: 5, stats: 4, videos: 4 },
  };
  const dc = DEPTH_CONFIG[depth];

  const freeIntentInstruction = isFreeIntent
    ? `FREE INTENT DETECTED: User explicitly wants zero-cost approach.
- requirements.money must be "${currencySymbol}0 — free tools only"
- infraPath: make the Zero Cost tier the primary recommendation
- resources: only list free=true tools, courses, and platforms
- Do NOT suggest paid tools as primary options — mention them only as future upgrades`
    : "";

  const systemPrompt = `You are BeforeUstart — a brutally honest AI reality check tool backed by real-world data and industry knowledge.

USER CONTEXT:
Country: ${country} | Currency: ${currency} (${currencySymbol}) | Locale: ${locale}
Express ALL monetary amounts in ${currency} using ${currencySymbol}. Convert USD estimates to local equivalent.
${freeIntentInstruction}

SCORING CALIBRATION — use the full range honestly:
10-20: Near-impossible for a typical starter. Extreme saturation, massive capital, multi-year skill ceiling, structural barriers.
21-35: Low probability. Works for people with specific existing advantages. Most fail within year one.
36-50: Hard. Majority fail. Success requires above-average execution, timing, and network.
51-65: Challenging but real. A committed person executing well has a genuine shot over 1-3 years.
66-78: Achievable. Clear path, learnable skills, real market. Requires sustained effort.
79-90: Accessible. Low barrier, teachable skills, existing demand. Most failures are execution failures.
Most business/creative ideas belong in 30-55. Do NOT default to 55-65. Be calibrated, not comfortable.

MINDSET: Only motivate where genuine scope exists. If competition is brutal or capital requirements are unrealistic for this user's context, say so without softening. No manufactured optimism. Where real opportunity exists, be specific about what it requires.

RULES:
- Be specific and data-driven. Cite real statistics with real sources.
- Never fabricate statistics. Only include stats you are highly confident are accurate.
- Detect the user's true intent and scope every section to what genuinely helps them.
- No sugarcoating. No motivational filler. Every sentence must carry information.
- Respond ONLY with valid JSON. No markdown, no backticks, no preamble.`;

  const userPrompt = `Reality check request: """${question}"""

Depth: ${depth} — ${dc.challenges} challenges, ${dc.opportunities} opportunities, ${dc.plan} plan phases, ${dc.stats} ground stats, ${dc.videos} YouTube videos.

Detect: Is this educational/learning? Business? Tech/build? Health? Creative? Life decision?

Return ONLY this JSON (all top-level fields required):

{
  "category": "business|creative|tech|health|social|learning|other",
  "categoryEmoji": "single emoji",
  "isEducational": true|false,
  "intent": "learn_skill|start_business|build_product|get_fit|create_content|career_change|life_decision|social_growth|other",
  "intentLabel": "3-5 word label",
  "realityScore": <10-90>,
  "scoreLabel": "short honest label — no motivational spin",
  "verdict": "one specific honest sentence — include a real stat if you have one",
  "timeToCompetence": "e.g. 3-6 months to basics — or null if not a learning goal",

  "challenges": [{"title":"","detail":"2-3 sentences with specific numbers or named obstacles","severity":"high|medium|low"}],
  "opportunities": [{"title":"","detail":"1-2 sentences of specific conditional upside — only real upside"}],

  "requirements": {
    "time": "specific e.g. 15-20 hrs/week for first 6 months",
    "money": "specific range in ${currency}${isFreeIntent ? ` — must be ${currencySymbol}0 free-tools-only` : ""}",
    "skills": ["skill1","skill2","skill3"]
  },

  "skillBreakdown": [{"skill":"","difficulty":1-10,"timeWeeks":1-52,"description":""}],

  "plan": [{"phase":"Days 1-7","focus":"","action":"specific concrete action with a deliverable"}],

  "mindset": "2-3 sentences. Be direct. If this usually fails, say why and what rare successes did differently. No softening.",
  "successFactors": ["factor1","factor2","factor3"],
  "redFlags": ["flag1","flag2"],

  "resources": {
    "books": [{"title":"","author":"","why":"","url":"https://... or null"}],
    "courses": [{"name":"","platform":"","url":"https://... or null","free":true,"why":""}],
    "apps": [{"name":"","purpose":"","url":"https://... or null","free":true}],
    "websites": [{"name":"","url":"https://...","why":""}],
    "communities": [{"name":"","platform":"Reddit|Discord|other","url":"https://... or null","why":""}]
  },

  "groundStats": [
    {
      "stat": "real verifiable statistic directly relevant to this idea",
      "source": "source name and approximate year",
      "context": "1 sentence on what this means for the user's specific plan"
    }
  ],

  "marketSnapshot": {
    "size": "market size in ${currency} equivalent — or null",
    "growth": "e.g. 12% YoY — or null",
    "saturation": "low|medium|high",
    "bestRegions": ["1-3 regions or platforms with strongest opportunity"],
    "worstMistake": "single most common and costly mistake"
  },

  "infraPath": {
    "applicable": true|false,
    "context": "1 sentence on what tech stack this applies to — omit if not tech/digital",
    "tiers": [
      {
        "tier": "Zero Cost Start",
        "monthlyCost": "${currencySymbol}0",
        "tools": [
          {
            "name": "tool name",
            "purpose": "what it does",
            "freeLimit": "specific limit e.g. 100GB/month",
            "url": "https://...",
            "controlLevel": "full|partial|limited"
          }
        ],
        "handles": "realistic scale this tier supports e.g. 0-500 users/month",
        "tradeoff": "specifically what you give up vs paid",
        "upgradeAt": "concrete signal: when to upgrade"
      },
      {
        "tier": "Growing",
        "monthlyCost": "range in ${currency}",
        "tools": [{"name":"","purpose":"","url":"","note":""}],
        "handles": "scale at this tier",
        "bestFor": "who this tier suits"
      },
      {
        "tier": "Serious Scale",
        "monthlyCost": "range in ${currency}",
        "tools": [{"name":"","purpose":"","url":"","note":""}],
        "handles": "scale at this tier",
        "bestFor": "who needs this"
      }
    ]
  },

  "radarAxes": [
    CHOOSE 6 axes matching the detected category — do NOT use business axes for health/learning/personal goals:
    - health/fitness/wellness → ["Habit Difficulty", "Lifestyle Impact", "Physical Demand", "Cost & Access", "Time to Results", "Consistency Risk"]
    - learning/education/skill → ["Learning Curve", "Time Investment", "Cost Barrier", "Depth Required", "Practice Needed", "Burnout Risk"]
    - business/ecommerce/freelance → ["Market Demand", "Competition", "Skill Gap", "Capital Needed", "Time to Revenue", "Execution Risk"]
    - tech/software/app/SaaS → ["Market Demand", "Tech Complexity", "Competition", "Capital Needed", "Time to Launch", "Execution Risk"]
    - career/life_decision → ["Market Fit", "Skill Transfer", "Financial Risk", "Time Investment", "Network Required", "Courage Needed"]
    - creative/content/social → ["Audience Demand", "Saturation", "Skill Required", "Time Investment", "Consistency Needed", "Discoverability"]
    {"axis": "...", "score": <0-100>},
    {"axis": "...", "score": <0-100>},
    {"axis": "...", "score": <0-100>},
    {"axis": "...", "score": <0-100>},
    {"axis": "...", "score": <0-100>},
    {"axis": "...", "score": <0-100>}
  ],

  "demandTrend": {
    "label": "specific label",
    "direction": "rising|falling|stable",
    "points": [9 integers 0-100 from 2 years ago to now],
    "trendNote": "1 sentence citing a specific data source"
  },

  "competitorBars": [
    {"label": "Your Starting Point", "value": <0-100>},
    {"label": "real named competitor type", "value": <0-100>},
    {"label": "Industry Average", "value": <0-100>},
    {"label": "low-end comparison", "value": <0-100>}
  ],

  "creativeSuggestion": {
    "applicable": true|false,
    "hook": "The one unconventional angle most people completely miss for this specific goal",
    "ideas": [
      {
        "title": "Short memorable name for the creative approach",
        "angle": "The specific unconventional twist in 1 sentence",
        "howTo": "2-3 concrete sentences on how to actually execute this approach",
        "effort": "low|medium|high",
        "whyItWorks": "The psychology, research, or strategic insight that makes this effective"
      }
    ]
  },

  "youtubeVideos": [
    {
      "searchQuery": "exact YouTube search string",
      "channel": "real well-known YouTube channel",
      "topic": "what this video covers specifically",
      "why": "1 sentence on why watching this before starting is essential"
    }
  ]
}

RULES:
- Learning: 2-3 books, 3-4 courses, 2-3 apps, 3-4 websites, 2 communities
- Business: 1-2 books, 2-3 websites, skip courses unless vital
- Health: 1-2 books, 2-3 apps, 1-2 websites, no courses
- Creative: 1-2 books, 2-3 apps, 2 websites, 2 communities
- Quick depth: minimal resources
${isFreeIntent ? "- FREE INTENT: Only free=true resources. No paid tools as primary options." : ""}
- skillBreakdown: only if skill-learning is central (max 5 skills), else []
- infraPath.applicable: true only for tech/software/website/app/SaaS/digital product
- All URLs must be real. Use null if unsure.
- groundStats: only real, sourced stats. Zero fabricated stats.
- radarAxes scores must be internally consistent with realityScore and challenges. USE CATEGORY-APPROPRIATE AXES, NOT GENERIC BUSINESS AXES FOR NON-BUSINESS TOPICS.
- All amounts in ${currency} (${currencySymbol}).
- creativeSuggestion: 2-3 genuinely creative/unconventional ideas tailored to the specific goal and user context. These should feel surprising and actionable, not generic advice. applicable=false only for extremely narrow edge cases.`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 4000,
        temperature: 0.6,
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
