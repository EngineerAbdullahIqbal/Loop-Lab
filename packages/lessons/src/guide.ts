/**
 * The Loop Engineering Guide — the complete theory from Curriculam.md,
 * restructured as CONTENT-AS-DATA for the in-app /guide page (same precedent
 * as lesson scripts and gallery examples). Each part carries an `art` id that
 * the web app maps to a hand-drawn SVG illustration, so every concept has a
 * visual (Phase 2 requirement).
 *
 * Inline <b>/<em>/<code> markup is allowed in text blocks; the renderer trusts
 * this package's own content only.
 */

export type GuideBlock =
  | { readonly kind: "p"; readonly text: string }
  | { readonly kind: "list"; readonly ordered?: boolean; readonly items: readonly string[] }
  | { readonly kind: "table"; readonly head: readonly string[]; readonly rows: ReadonlyArray<readonly string[]> }
  | { readonly kind: "quote"; readonly text: string }
  | { readonly kind: "code"; readonly lang: string; readonly text: string }
  | { readonly kind: "teach"; readonly text: string }
  | { readonly kind: "h3"; readonly text: string };

export interface GuideSection {
  readonly id: string;
  readonly part: number;
  readonly title: string;
  readonly tagline: string;
  readonly art: string;
  readonly blocks: readonly GuideBlock[];
}

export const GUIDE: readonly GuideSection[] = [
  {
    id: "big-idea",
    part: 1,
    title: "The Big Idea",
    tagline: "Start with chai, not computers.",
    art: "chai",
    blocks: [
      { kind: "p", text: "Imagine making chai: put the pot on the stove, <b>taste it</b>. Not sweet enough? Add sugar, <b>taste again</b>. Too weak? Wait a minute, <b>taste again</b>. Perfect? <b>Stop.</b> Pour and serve." },
      { kind: "p", text: "You didn't follow one fixed instruction. You did something, <b>checked the result, and adjusted</b> — again and again until the goal was met. That repeat-check-adjust cycle is a <b>loop</b>, and you've been a loop engineer your whole life without knowing it." },
      { kind: "h3", text: "So what is Loop Engineering in AI?" },
      { kind: "p", text: "<b>Old way (prompting):</b> you ask an AI one question → it answers once → done. If the answer is wrong, <em>you</em> have to notice and ask again. You are doing all the checking." },
      { kind: "p", text: "<b>New way (loop engineering):</b> you design a <b>system</b> where the AI <b>Reasons</b> (thinks about what to do next), <b>Acts</b> (actually does something), <b>Observes</b> (looks at what happened), and <b>Checks</b> (\"is the goal met?\") — and if not done, goes back to step one. Your job shifts from writing clever prompts to designing good loops." },
      { kind: "quote", text: "Loop engineering is designing the repeating cycle — act, observe, check, adjust — that lets an AI agent keep working on a task until it's actually done, safely." },
      { kind: "h3", text: "Where did the term come from? (honest history)" },
      { kind: "list", items: [
        "The underlying idea is old: the <b>ReAct pattern</b> (Reason + Act) from Princeton/Google research (~2022) — interleave thinking steps with action steps.",
        "The <em>phrase</em> went viral in <b>June 2026</b> after posts by <b>Boris Cherny</b> (creator of Claude Code) — \"I don't prompt Claude anymore — I have loops running that prompt Claude\" — and <b>Peter Steinberger</b> (creator of OpenClaw).",
        "<b>Andrew Ng</b> then formalized it as three nested loops, and <b>Addy Osmani</b> wrote the widely shared post that gave the pattern its name.",
      ] },
      { kind: "teach", text: "Ask students: \"When you cook, do you follow the recipe blindly, or do you taste and adjust?\" Everyone says taste-and-adjust. Then say: \"Old AI followed the recipe blindly. New AI tastes and adjusts. Loop engineering is teaching AI to taste.\"" },
    ],
  },
  {
    id: "anatomy",
    part: 2,
    title: "Anatomy of a Loop",
    tagline: "Six parts — the skeleton of everything.",
    art: "anatomy",
    blocks: [
      { kind: "p", text: "Every well-engineered agent loop has these parts. Memorize this — it's the skeleton of everything:" },
      { kind: "table", head: ["#", "Part", "Plain meaning", "Chai version"], rows: [
        ["1", "<b>Goal</b>", "What \"done\" looks like", "\"Sweet, strong chai\""],
        ["2", "<b>Reason</b>", "Decide the next move", "\"Too weak → boil longer\""],
        ["3", "<b>Act</b>", "Do one concrete thing", "Add sugar / wait"],
        ["4", "<b>Observe</b>", "See what actually happened", "Taste it"],
        ["5", "<b>Halt condition</b>", "The rule for stopping", "\"Tastes right\" OR \"10 minutes passed\""],
        ["6", "<b>State / Memory</b>", "What you carry between rounds", "\"Already added sugar twice\""],
      ] },
      { kind: "h3", text: "The three primitives (the parts beginners forget)" },
      { kind: "list", ordered: true, items: [
        "<b>Halt conditions</b> — every loop needs at least TWO ways to stop: a <em>success stop</em> (the goal check passes) and a <em>safety stop</em> (a maximum number of steps / time / money, no matter what).",
        "<b>State carryover</b> — the agent must remember what it already tried, or it will repeat the same mistake forever.",
        "<b>Recovery paths</b> — a plan for when an action fails (\"the test crashed → read the error → try a different fix\"), instead of giving up or repeating blindly.",
      ] },
      { kind: "quote", text: "A loop missing any of these isn't engineering — it's gambling." },
      { kind: "teach", text: "Play \"Guess my number 1–100.\" The student guesses, you say higher/lower. Their guess is the Act, your higher/lower is the Observe, their narrowing is State, and \"you got it!\" is the Halt condition. They just ran an agent loop with their brain." },
    ],
  },
  {
    id: "nested-loops",
    part: 3,
    title: "The Loops Within Loops",
    tagline: "Fast inner loops for the machine, slower outer loops for humans.",
    art: "nested",
    blocks: [
      { kind: "p", text: "Loop engineering isn't one loop — it's loops stacked inside each other. Andrew Ng's popular framing uses <b>three nested loops</b>, fast to slow:" },
      { kind: "list", ordered: true, items: [
        "<b>Agentic coding loop</b> (seconds–minutes): the agent writes code → runs tests → reads failures → fixes → repeats. Humans mostly stay out.",
        "<b>Developer feedback loop</b> (minutes–hours): a human reviews what the agent produced, steers it, approves or rejects.",
        "<b>External feedback loop</b> (days–weeks): real users react to the product; that feedback flows back into what you ask the agent to build next.",
      ] },
      { kind: "p", text: "LangChain describes a similar stack of four (agent → verification → application → a \"hill-climbing\" loop that analyzes past runs to improve the system itself). Naming varies by author — the shared idea is: <b>fast inner loops for the machine, slower outer loops for humans, and the outer loops correct the inner ones.</b>" },
      { kind: "h3", text: "Human-in-the-loop — the safety layer" },
      { kind: "p", text: "Whenever an action is risky (deleting files, sending money, publishing something), the loop should <b>pause and ask a human</b>: approval before sensitive actions, a human as the grader in the verification loop, a human sign-off before output reaches end users." },
      { kind: "teach", text: "Family analogy — the child does homework and self-checks (inner loop), a parent reviews it nightly (middle loop), and exam results each term change how the family studies (outer loop). Fast loops inside slow loops." },
    ],
  },
  {
    id: "anti-patterns",
    part: 4,
    title: "Anti-patterns",
    tagline: "How loops go wrong.",
    art: "antipatterns",
    blocks: [
      { kind: "list", items: [
        "<b>The infinite loop.</b> No halt condition → the agent runs forever, burning time and money. Rule: <em>never write a loop without a hard step limit</em>. (Try it in Lesson 4 of the playground — break the verifier and watch.)",
        "<b>\"Loopmaxxing.\"</b> The community's joke-word for over-looping: letting agents churn for hours on tasks that needed 5 minutes of human thought. More loop ≠ more smart — a loop with a weak verifier just produces confident garbage faster.",
        "<b>Repeating the same mistake.</b> No state carryover → tries fix A, fails, forgets, tries fix A again… forever. Symptom: an agent apologizing \"You're right, let me fix that!\" while changing nothing.",
        "<b>Vague goals.</b> \"Make it better\" is not checkable. Loops need goals a machine can verify: \"all 12 tests pass\", \"page loads under 2 seconds\". <em>If you can't check it, you can't loop on it.</em>",
        "<b>No human gate on risky actions.</b> An agent that can delete, spend, or publish inside an unattended loop is a loaded weapon. Always gate irreversible actions behind human approval.",
      ] },
      { kind: "teach", text: "\"What happens if you tell a robot 'stir the pot until it's perfect' but never define perfect and never give it a timer?\" Students immediately get it: it stirs forever. That's a bad loop." },
    ],
  },
  {
    id: "first-loop",
    part: 5,
    title: "Your First Real Loop",
    tagline: "Every serious agent framework is an elaborate version of ~12 lines.",
    art: "skeleton",
    blocks: [
      { kind: "p", text: "Here's the skeleton in Python-style pseudocode. Read it like English:" },
      { kind: "code", lang: "python", text: `GOAL = "all tests pass"
MAX_STEPS = 10                # safety stop — never skip this
memory = []                   # state carryover

for step in range(MAX_STEPS):
    thought = llm.reason(GOAL, memory)   # 1. Reason
    result  = run_action(thought.action) # 2. Act
    memory.append((thought, result))     # 3. Observe + remember

    if check_goal(result):               # 4. Halt: success stop
        break
else:
    print("Hit safety limit — ask a human")  # Halt: safety stop` },
      { kind: "p", text: "The <code>check_goal</code> function — the <b>verifier</b> — is where most of the engineering value lives: real tests, linters, a second AI grading the first, or a human clicking approve." },
      { kind: "h3", text: "Levels of practice (a maturity ladder)" },
      { kind: "table", head: ["Level", "Name", "What it means"], rows: [
        ["0", "<b>Prompting</b>", "You ask, AI answers once. You verify everything."],
        ["1", "<b>One loop</b>", "Agent retries with feedback until tests pass, with a step limit."],
        ["2", "<b>Verified loop</b>", "A real verifier decides success; humans gate risky actions."],
        ["3", "<b>Nested loops</b>", "Agent loops inside human review loops inside user-feedback loops."],
        ["4", "<b>Self-improving</b>", "The system analyzes its own traces and improves its prompts, tools, and checks."],
      ] },
      { kind: "p", text: "Most people teaching loop engineering in 2026 are helping teams move from Level 0–1 to Level 2–3." },
    ],
  },
  {
    id: "teaching",
    part: 6,
    title: "Teaching Playbook",
    tagline: "A 60–90 minute lesson plan for complete beginners.",
    art: "teaching",
    blocks: [
      { kind: "table", head: ["Time", "Activity", "Playground"], rows: [
        ["10 min", "Chai story + \"guess my number\" game in pairs", "—"],
        ["10 min", "Name the parts of a loop from the game they just played", "Lesson 1–2"],
        ["20 min", "Run the loop; students predict each next step before pressing it", "Lesson 3"],
        ["15 min", "<b>Break the loop</b>: remove the stop condition, watch it run away", "Lesson 4"],
        ["15 min", "Students play \"the human in the loop\" — approve/reject the agent's work", "Lesson 5–6"],
        ["10 min", "Each student explains one loop from their own daily life", "—"],
      ] },
      { kind: "h3", text: "Golden rules for non-tech audiences" },
      { kind: "list", items: [
        "Never show code first. Show a <em>behavior</em>, then name it.",
        "Let them <em>be</em> the loop (guessing game, taste-and-adjust) before watching a machine do it.",
        "The \"runaway loop\" demo is your most memorable moment — build the lesson around it.",
        "End by having each student find a loop in their own life. If they can name Goal, Act, Observe, Halt — they've learned it.",
      ] },
    ],
  },
  {
    id: "glossary",
    part: 7,
    title: "Glossary",
    tagline: "Plain words for every term.",
    art: "glossary",
    blocks: [
      { kind: "table", head: ["Term", "Plain meaning"], rows: [
        ["<b>Agent</b>", "An AI that can take actions (not just chat), running inside a loop."],
        ["<b>Agent loop</b>", "The repeat cycle: reason → act → observe → check."],
        ["<b>ReAct</b>", "The original research pattern of alternating Reasoning and Acting steps."],
        ["<b>Halt / stop condition</b>", "The rule that ends the loop (success or safety limit)."],
        ["<b>Verifier / grader</b>", "The thing that checks whether the work is actually correct."],
        ["<b>State carryover</b>", "Memory of what was already tried, passed between rounds."],
        ["<b>Recovery path</b>", "The plan for when an action fails mid-loop."],
        ["<b>Human-in-the-loop</b>", "A pause point where a person approves before the loop continues."],
        ["<b>Orchestrator</b>", "A system that manages many loops/agents at once."],
        ["<b>Trace</b>", "The recorded history of one loop run, used to debug and improve the system."],
        ["<b>Loopmaxxing</b>", "(slang) Overusing loops where simpler solutions work."],
      ] },
    ],
  },
  {
    id: "four-eras",
    part: 8,
    title: "The Four Eras",
    tagline: "Where loops came from.",
    art: "eras",
    blocks: [
      { kind: "table", head: ["Year", "Era", "The skill"], rows: [
        ["2023", "<b>Prompt engineering</b>", "Phrase one request well."],
        ["2024", "<b>Orchestration</b>", "Chain several AI steps together."],
        ["2025", "<b>Context engineering</b>", "Control what the model sees (files, memory, tools)."],
        ["2026", "<b>Loop engineering</b>", "Design the system that drives the model <em>without you</em> pressing enter between steps."],
      ] },
      { kind: "p", text: "Under the hood, nothing mystical happened. An \"agent\" was always just a model inside a <code>while</code> loop with tools. What changed in 2025–26: models became reliable enough to run that loop for hours without a human babysitting every cycle — so the bottleneck moved from <em>model capability</em> to <em>loop design</em>." },
      { kind: "quote", text: "You used to BE the loop. Loop engineering is stepping out of the cycle and up to designing the track the agent runs on." },
    ],
  },
  {
    id: "ten-minutes",
    part: 9,
    title: "A Real Loop in 10 Minutes",
    tagline: "~30 lines: model call, verifier, feedback wiring, two stops.",
    art: "tenmin",
    blocks: [
      { kind: "p", text: "The task: make an AI write a kid-friendly definition of a loop — and keep looping until it passes a machine check. (You can also build this without code in the playground's <b>Agent Studio</b>.)" },
      { kind: "code", lang: "python", text: `def verify(text):              # THE VERIFIER — the heart of the loop
    problems = []
    if len(text.split()) > 25: problems.append("longer than 25 words")
    for jargon in ["iterative","algorithm","recursion"]:
        if jargon in text.lower(): problems.append(f"jargon: {jargon}")
    return problems            # empty list = PASS

goal, feedback = "Explain an agent loop to a 10-year-old in ONE sentence.", ""
for step in range(1, 5):       # HALT: safety stop = 4 attempts
    answer   = ask(goal + feedback)     # REASON + ACT (one model call)
    problems = verify(answer)           # OBSERVE + CHECK
    if not problems: break              # success stop
    feedback = f" Failed: {', '.join(problems)}. Fix ONLY that."
else:
    print("Safety stop hit — a human should look at this.")` },
      { kind: "p", text: "Notice where the intelligence lives: not in the prompt — in the <b>verifier</b> and the <b>feedback wiring</b>. That's loop engineering in miniature. Never paste an API key into code you share." },
    ],
  },
  {
    id: "roadmap",
    part: 10,
    title: "The 14-Step Roadmap",
    tagline: "Manual prompter → loop engineer, in three tiers.",
    art: "roadmap",
    blocks: [
      { kind: "h3", text: "Tier 1 — Should you even build a loop? (1–4)" },
      { kind: "list", ordered: true, items: [
        "<b>Spot the repeat.</b> Loops only pay off on repeating work — for one-off jobs, a good manual prompt wins.",
        "<b>Define \"done\" as a check, not a feeling.</b> If a machine can't verify it, you can't loop on it yet.",
        "<b>Pass the four-condition test:</b> the task repeats, verification can be automated, your budget absorbs wasted cycles, and the agent has the tools it needs.",
        "<b>Do it manually three times, writing down every step.</b> Your notes ARE the loop script.",
      ] },
      { kind: "h3", text: "Tier 2 — Master the five building blocks (5–9)" },
      { kind: "list", ordered: true, items: [
        "<b>Build the verifier FIRST</b> — before any agent code. The verifier is your taste, made executable.",
        "<b>Set two halt conditions:</b> the success check, and a hard limit that fires no matter what.",
        "<b>Create one state file</b> the loop reads at the start and writes at the end of every cycle.",
        "<b>Design recovery paths</b> for each way an action can fail: retry differently, skip, or escalate.",
        "<b>Mark the human gates:</b> every irreversible action (delete, send, spend, publish) pauses for approval.",
      ] },
      { kind: "h3", text: "Tier 3 — Build the smallest viable loop (10–14)" },
      { kind: "list", ordered: true, items: [
        "<b>Wrap one cycle</b> cleanly: reason → act → observe → check, exactly once.",
        "<b>Loop it, capped at 5 iterations, and WATCH every run.</b> Supervised loops first. Always.",
        "<b>Log traces</b> — they're how you debug a system that ran while you slept.",
        "<b>Only after ~10 clean supervised runs, add a trigger.</b> Automation is earned, not assumed.",
        "<b>Review traces weekly and improve the VERIFIER, not just the prompt.</b> You've stopped being the loop; you're now its editor.",
      ] },
    ],
  },
  {
    id: "catalog",
    part: 11,
    title: "The Loop Catalog",
    tagline: "41 copy-paste loops across six areas of life.",
    art: "catalog",
    blocks: [
      { kind: "p", text: "The full catalog has 41 ready-to-use loops — each one names what it does and when it stops, capped at a max step count. Eight of them are <b>playable in the Loop Gallery</b> on the playground page. A taste of each category:" },
      { kind: "table", head: ["Category", "Examples"], rows: [
        ["💻 <b>Coding</b> (10)", "Test-fix · lint-clean · bug-narrow · safe-refactor · docs-sync · review · dependency · performance · type-coverage · migration"],
        ["✍️ <b>Writing</b> (7)", "Draft-critic · simplify · headline · back-translation · claim-check · voice-match · post-rules"],
        ["📚 <b>Study</b> (6)", "Flashcards · Feynman · problem-set · vocabulary · interview · shrink"],
        ["💼 <b>Business</b> (6)", "Inbox-triage · lead-qualify · report-verify · SOP · price-watch · minutes"],
        ["📊 <b>Data</b> (6)", "Data-clean · query-refine · triangulate · label-bootstrap · experiment · theme"],
        ["🏠 <b>Personal</b> (6)", "Meal-plan · budget · trip · habit · declutter · <b>the chai loop ☕</b>"],
      ] },
      { kind: "quote", text: "Template for every entry: what it does → when it stops. Copy it, replace the CAPS, cap the steps." },
    ],
  },
  {
    id: "frontier",
    part: 12,
    title: "Loops on Frontier Models",
    tagline: "Better models make loop engineering MORE important, not less.",
    art: "frontier",
    blocks: [
      { kind: "p", text: "Frontier models (e.g. Claude Fable 5, mid-2026) are built for long-horizon agentic work — running for days, delegating to sub-agents, checking their own work. That changes loop design in five ways:" },
      { kind: "list", ordered: true, items: [
        "<b>Longer inner loops become viable.</b> The safety stop, not model confusion, becomes your main brake — set it deliberately.",
        "<b>Cost discipline is a design input.</b> Route routine cycles to cheaper models; set a per-run token budget as a halt condition.",
        "<b>Self-verification helps but doesn't replace your verifier.</b> Treat the model checking itself as a free first pass — keep your independent verifier as the real gate.",
        "<b>Design for refusals as a recovery path.</b> A step can come back refused; retry on a fallback model or escalate to a human — never silently drop it.",
        "<b>Sub-agent delegation is a loop-within-loop.</b> Each sub-agent needs its own halt conditions and budget, or one runaway child burns the parent's budget.",
      ] },
      { kind: "quote", text: "Better models don't make loop engineering obsolete — the loops run longer, touch more, and cost more per mistake." },
    ],
  },
  {
    id: "three-debts",
    part: 13,
    title: "Costs & The Three Debts",
    tagline: "They get worse the BETTER the loop works.",
    art: "debts",
    blocks: [
      { kind: "h3", text: "The honest cost sheet" },
      { kind: "list", items: [
        "<b>Money:</b> looped workflows commonly cost ~3–10× an equivalent single prompt chain — every cycle re-sends context. Budget caps are mandatory.",
        "<b>Time:</b> 5–20 iterations means seconds-to-minutes per run — fine for background work, wrong for anything a user is waiting on.",
        "<b>Complexity:</b> state, traces, verifiers, and evaluation are real engineering. A loop is infrastructure you now own.",
        "<b>Model dependency:</b> the same loop that converges on a frontier model can stall forever on a weak one.",
      ] },
      { kind: "h3", text: "The three debts" },
      { kind: "list", ordered: true, items: [
        "<b>Verification debt.</b> The more reliably a loop ships, the less you check its output — and weak-verifier garbage passes with a green tick. <em>Pay it down:</em> random human audits of \"passing\" runs, forever.",
        "<b>Comprehension debt.</b> Loops produce work faster than any human reads it — until something breaks and nobody understands what the system built. <em>Pay it down:</em> the weekly trace review.",
        "<b>Harness debt.</b> Every prompt, schema, grader, and API call rots as models and prices change underneath it. <em>Pay it down:</em> fewer, better loops; version your harnesses; re-run evals when you swap models.",
      ] },
      { kind: "quote", text: "A loop transfers your effort from doing the work to defining correct and auditing the machine — the debts are what happens when you skip the auditing half." },
    ],
  },
];
