# Loop Engineering: The Complete Beginner's Guide
### Learn it. Then teach it — even to students who have never written code.

> **How to use this guide:** Read one section, then open `loop-engineering-playground.html` and do the matching lab. Learning happens in the doing, not the reading. Each section ends with a **Teach-It Box** — a ready-made way to explain the idea to a total beginner.

---

## Part 1 — The Big Idea (no tech needed)

### 1.1 Start with chai, not computers

Imagine making chai:

1. Put the pot on the stove
2. **Taste it**
3. Not sweet enough? Add sugar. **Taste again.**
4. Too weak? Wait a minute. **Taste again.**
5. Perfect? **Stop.** Pour and serve.

You didn't follow one fixed instruction. You did something, **checked the result, and adjusted** — again and again until the goal was met. That repeat-check-adjust cycle is a **loop**, and you've been a loop engineer your whole life without knowing it.

### 1.2 So what is Loop Engineering in AI?

Old way (prompting): you ask an AI one question → it answers once → done. If the answer is wrong, *you* have to notice and ask again. You are doing all the checking.

New way (loop engineering): you design a **system** where the AI:

1. **Reasons** — thinks about what to do next
2. **Acts** — actually does something (runs code, searches, edits a file)
3. **Observes** — looks at what happened
4. **Checks** — "Is the goal met? Should I stop?"
5. If not done → go back to step 1

The AI keeps cycling until the goal is genuinely achieved (or a safety limit stops it). Your job shifts from *writing clever prompts* to *designing good loops*.

**One-sentence definition:**
> Loop engineering is designing the repeating cycle — act, observe, check, adjust — that lets an AI agent keep working on a task until it's actually done, safely.

### 1.3 Where did this term come from? (honest history)

- The underlying idea is old: the **ReAct pattern** (Reason + Act) from research at Princeton and Google (~2022) — interleave thinking steps with action steps.
- The *phrase* "loop engineering" went viral in **June 2026** after posts by **Boris Cherny** (creator of Claude Code at Anthropic) and **Peter Steinberger** (creator of OpenClaw). Cherny's famous line, roughly: *"I don't prompt Claude anymore — I have loops running that prompt Claude."* Steinberger's: *"You shouldn't be prompting coding agents anymore. You should be designing loops that prompt your agents."*
- **Andrew Ng** (DeepLearning.AI) then formalized it as **three nested loops**, and **Addy Osmani** wrote a widely shared post that gave the pattern its name and a five-part architecture.

*(This history is from July 2026 coverage — it's a fast-moving topic, so verify current framing before teaching it as settled fact.)*

> **Teach-It Box:** Ask students: "When you cook, do you follow the recipe blindly, or do you taste and adjust?" Everyone says taste-and-adjust. Then say: "Old AI followed the recipe blindly. New AI tastes and adjusts. Loop engineering is teaching AI to taste."

---

## Part 2 — Anatomy of a Loop (the 6 parts)

Every well-engineered agent loop has these parts. Memorize this — it's the skeleton of everything:

| # | Part | Plain meaning | Chai version |
|---|------|---------------|--------------|
| 1 | **Goal** | What "done" looks like | "Sweet, strong chai" |
| 2 | **Reason** | Decide the next move | "It's too weak → boil longer" |
| 3 | **Act** | Do one concrete thing | Add sugar / wait |
| 4 | **Observe** | See what actually happened | Taste it |
| 5 | **Halt condition** | The rule for stopping | "Tastes right" OR "10 minutes passed" |
| 6 | **State / Memory** | What you carry between rounds | "I already added sugar twice" |

### 2.1 The three primitives (the parts beginners forget)

Practitioners boil the runtime down to three things that must exist for a loop to be safe and useful:

1. **Halt conditions** — every loop needs at least TWO ways to stop:
   - *Success stop:* the goal check passes
   - *Safety stop:* a maximum number of steps / time / money, no matter what
2. **State carryover** — the agent must remember what it already tried, or it will repeat the same mistake forever.
3. **Recovery paths** — a plan for when an action fails ("the test crashed → read the error → try a different fix"), instead of just giving up or repeating blindly.

A loop missing any of these isn't engineering — it's gambling.

> **Teach-It Box:** Play "Guess my number 1–100." Student guesses, you say higher/lower. Point out: their *guess* is the Act, your *higher/lower* is the Observe, their narrowing is *State*, and "you got it!" is the *Halt condition*. They just ran an agent loop with their brain.

---

## Part 3 — The Loops Within Loops

Loop engineering isn't one loop — it's loops stacked inside each other. Andrew Ng's popular framing uses **three nested loops** (fast → slow):

1. **Agentic coding loop** (seconds–minutes): the agent writes code → runs tests → reads failures → fixes → repeats. Humans mostly stay out.
2. **Developer feedback loop** (minutes–hours): a human reviews what the agent produced, steers it, approves or rejects.
3. **External feedback loop** (days–weeks): real users react to the product; that feedback flows back into what you ask the agent to build next.

LangChain describes a similar stack of four (agent loop → verification loop → application loop → "hill-climbing" loop that analyzes past runs to improve the system itself). The exact naming varies by author — the shared idea is: **fast inner loops for the machine, slower outer loops for humans, and the outer loops correct the inner ones.**

### Human-in-the-loop = the safety layer

Whenever an action is risky (deleting files, sending money, publishing something), the loop should **pause and ask a human**. In practice:

- Agent loop: require human approval before sensitive actions
- Verification loop: a human acts as the grader
- Application loop: a human approves output before it reaches end users

> **Teach-It Box:** Family analogy — the child does homework and self-checks (inner loop), a parent reviews it nightly (middle loop), and exam results each term change how the family studies (outer loop). Fast loops inside slow loops.

---

## Part 4 — Anti-patterns (how loops go wrong)

### 4.1 The infinite loop
No halt condition → the agent runs forever, burning time and money. **Rule: never write a loop without a hard step limit.** (Try this in Lab 3 of the playground — deliberately remove the stop condition and watch.)

### 4.2 "Loopmaxxing"
The community's joke-word for over-looping: throwing loops at everything, letting agents churn for hours on tasks that needed 5 minutes of human thought, or stacking loops so deep nobody understands the system. More loop ≠ more smart. A loop is only as good as its **check** — a loop with a weak verifier just produces confident garbage faster.

### 4.3 Repeating the same mistake
No state carryover → the agent tries fix A, fails, forgets, tries fix A again... forever. Symptom: an agent apologizing "You're right, let me fix that!" over and over while changing nothing.

### 4.4 Vague goals
"Make it better" is not a checkable goal. Loops need goals a machine can verify: *"all 12 tests pass"*, *"page loads under 2 seconds"*. **If you can't check it, you can't loop on it.**

### 4.5 No human gate on risky actions
An agent that can delete, spend, or publish inside an unattended loop is a loaded weapon. Always gate irreversible actions behind human approval.

> **Teach-It Box:** "What happens if you tell a robot 'stir the pot until it's perfect' but never define perfect and never give it a timer?" Students immediately get it: it stirs forever. That's a bad loop.

---

## Part 5 — Build Your First Real Loop (gentle code)

You don't need this section to *understand* loop engineering — but here's what the skeleton looks like in Python-style pseudocode. Read it like English:

```python
GOAL = "all tests pass"
MAX_STEPS = 10                      # safety stop — never skip this
memory = []                         # state carryover

for step in range(MAX_STEPS):
    thought = llm.reason(GOAL, memory)      # 1. Reason
    result  = run_action(thought.action)    # 2. Act (run code/tests)
    memory.append((thought, result))        # 3. Observe + remember

    if check_goal(result):                  # 4. Halt: success stop
        print("Done in", step + 1, "steps")
        break
else:
    print("Hit safety limit — ask a human")  # 4. Halt: safety stop
```

Every serious agent framework — Claude Code, custom agents, orchestrators — is an elaborate version of these ~12 lines. The `check_goal` function (the **verifier**) is where most of the engineering value lives: real tests, linters, a second AI grading the first, or a human clicking approve.

**A note on tools:** projects like OpenClaw (a persistent always-on orchestrator) and tightly-scoped experiment loops exist, but the ecosystem is changing weekly in 2026 — verify names and current best tools before teaching specifics.

### Levels of practice (a simple maturity ladder)

1. **Level 0 — Prompting:** you ask, AI answers once. You verify everything.
2. **Level 1 — One loop:** agent retries with feedback until tests pass, with a step limit.
3. **Level 2 — Verified loop:** a real verifier (tests/grader) decides success, human gates risky actions.
4. **Level 3 — Nested loops:** agent loops inside human review loops inside user-feedback loops.
5. **Level 4 — Self-improving:** the system analyzes its own past runs (traces) and improves its own prompts, tools, and checks.

Most people teaching "loop engineering" in 2026 are helping teams move from Level 0–1 to Level 2–3.

---

## Part 6 — Teaching Playbook (for your students)

A 60–90 minute lesson plan for complete beginners, matched to the HTML playground:

| Time | Activity | Playground lab |
|------|----------|----------------|
| 10 min | Chai story + "guess my number" game in pairs | — |
| 10 min | Name the 6 parts of a loop from the game they just played | Lab 1 |
| 20 min | Run the agent loop simulation; students predict each next step before pressing it | Lab 2 |
| 15 min | **Break the loop:** remove the stop condition, watch it run away, discuss why safety stops matter | Lab 3 |
| 15 min | Students play "the human in the loop" — approve/reject the agent's work | Lab 4 |
| 10 min | Quiz + each student explains one loop from their own daily life | Quiz |

**Golden rules for teaching non-tech audiences:**
- Never show code first. Show a *behavior*, then name it.
- Let them *be* the loop (guessing game, taste-and-adjust) before watching a machine do it.
- The "runaway loop" demo is your most memorable moment — build the lesson around it.
- End by having each student find a loop in their own life (studying, cricket practice, cooking). If they can name Goal, Act, Observe, Halt — they've learned it.

---

## Part 7 — Glossary (plain words)

- **Agent** — an AI that can take actions (not just chat), running inside a loop.
- **Agent loop** — the repeat cycle: reason → act → observe → check.
- **ReAct** — the original research pattern of alternating Reasoning and Acting steps.
- **Halt / stop condition** — the rule that ends the loop (success or safety limit).
- **Verifier / grader** — the thing that checks whether the work is actually correct.
- **State carryover** — memory of what was already tried, passed between rounds.
- **Recovery path** — the plan for when an action fails mid-loop.
- **Human-in-the-loop** — a pause point where a person approves before the loop continues.
- **Orchestrator** — a system that manages many loops/agents at once.
- **Trace** — the recorded history of one loop run, used to debug and improve the system.
- **Loopmaxxing** — (slang, half-joking) overusing loops where simpler solutions work.

---

## Part 8 — Where Loops Came From: The Four Eras

The skill of working with AI has moved in stages, each stacking on the last:

1. **2023 — Prompt engineering:** phrase one request well.
2. **2024 — Orchestration:** chain several AI steps together.
3. **2025 — Context engineering:** control what the model sees (files, memory, tools).
4. **2026 — Loop engineering:** design the system that drives the model *without you* pressing enter between steps.

Under the hood, nothing mystical happened. An "agent" was always just a model inside a `while` loop with tools. What changed in 2025–26: models became reliable enough to run that loop for hours without a human babysitting every cycle — so the bottleneck moved from *model capability* to *loop design*. You used to BE the loop (reading output, catching mistakes, deciding what's next). Loop engineering is stepping out of the cycle and up to designing the track the agent runs on.

---

## Part 9 — Build a Real Loop in Under 10 Minutes

You need: Python installed, and a free Google Gemini API key (get one at ai.google.dev — free tier available). **Never paste your key into chats, code you share, or public repos.**

The task: make the AI write a kid-friendly definition of a loop — and keep looping until it passes a machine check.

```python
# my_first_loop.py  — a complete agent loop in ~30 lines
import os, urllib.request, json

KEY   = os.environ["GEMINI_KEY"]          # set this in your terminal, never in code
MODEL = "gemini-2.5-flash"                # check ai.google.dev for the current free model name
URL   = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"

def ask(prompt):                          # ACT: one model call
    body = json.dumps({"contents":[{"parts":[{"text":prompt}]}]}).encode()
    req  = urllib.request.Request(URL, body, {"Content-Type":"application/json"})
    data = json.loads(urllib.request.urlopen(req).read())
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()

def verify(text):                         # THE VERIFIER: the heart of the loop
    problems = []
    if len(text.split()) > 25: problems.append("longer than 25 words")
    for jargon in ["iterative","algorithm","boolean","recursion","construct"]:
        if jargon in text.lower(): problems.append(f"uses jargon: {jargon}")
    return problems                       # empty list = PASS

goal     = "Explain an AI agent loop to a 10-year-old in ONE sentence."
feedback = ""
for step in range(1, 5):                  # HALT: safety stop = 4 attempts max
    answer   = ask(goal + feedback)                       # REASON+ACT
    problems = verify(answer)                             # OBSERVE
    print(f"Attempt {step}: {answer}\n  Check: {problems or 'PASS ✅'}")
    if not problems:                                      # CHECK: success stop
        break
    feedback = f" Your last try failed because it was {', '.join(problems)}. Fix ONLY that."
else:
    print("Safety stop hit — a human should look at this.")
```

Run it: `GEMINI_KEY=your_key python my_first_loop.py`

Notice where the intelligence lives: not in the prompt — in the **verifier** and the **feedback wiring**. That's loop engineering in miniature. *(API endpoint format per Google's public docs as of mid-2026 — if it errors, check the current syntax at ai.google.dev.)*

---

## Part 10 — The 14-Step Roadmap: Manual Prompter → Loop Engineer

*A "14-step roadmap" framing circulates widely in the community (three tiers: decide if you need a loop, learn the building blocks, build the smallest one). The version below is my own original take on it — use it, adapt it, teach it.*

### Tier 1 — Should you even build a loop? (Steps 1–4)
1. **Spot the repeat.** List every task you've done with AI 3+ times this month. Loops only pay off on repeating work — for one-off jobs, a good manual prompt wins.
2. **Define "done" as a check, not a feeling.** "All tests pass," "under 25 words, no jargon" — if a machine (or strict rubric) can't verify it, you can't loop on it yet.
3. **Pass the four-condition test:** the task repeats, verification can be automated, your budget can absorb wasted cycles, and the agent has the tools it needs. Miss one → don't loop yet.
4. **Do it manually three times, writing down every step.** Your notes ARE the loop script. If you can't write the steps, the agent can't run them.

### Tier 2 — Master the five building blocks (Steps 5–9)
5. **Build the verifier FIRST** — before any agent code. Tests, rules, rubrics, a grader model. The verifier is your taste, made executable.
6. **Set two halt conditions:** the success check, and a hard limit (max steps / time / money) that fires no matter what.
7. **Create one state file** the loop reads at the start and writes at the end of every cycle: what's done, what failed, what to try next. This is the agent's memory between runs.
8. **Design recovery paths:** for each way an action can fail (error, timeout, bad output), decide in advance: retry differently, skip, or escalate.
9. **Mark the human gates:** list every irreversible action (delete, send, spend, publish). The loop must pause for approval at each one.

### Tier 3 — Build the smallest viable loop (Steps 10–14)
10. **Wrap one cycle:** a single script that does reason → act → observe → check exactly once, cleanly.
11. **Loop it, capped at 5 iterations, and WATCH every run.** Supervised loops first. Always.
12. **Log traces:** save every cycle's input, output, and verdict. Traces are how you debug a system that ran while you slept.
13. **Only after ~10 clean supervised runs, add a trigger** (a schedule, "on new file," "on pull request"). Automation is earned, not assumed.
14. **Review traces weekly and improve the VERIFIER, not just the prompt.** Your judgment — what "correct" looks like — becomes the product. You've stopped being the loop; you're now its editor.

---

## Part 11 — The Loop Catalog: 41 Copy-Paste Loops

*Original catalog. Each entry: what it does → when it stops. Copy the template, replace the CAPS, cap every loop at a max step count. Every one of these also lives in the HTML playground with a copy button.*

### A. Coding (1–10)
1. **Test-fix loop** — run tests → fix one failure → rerun. *Stops:* all green. `Run MY_TESTS. Fix only the first failure. Rerun. Repeat until all pass or 8 tries.`
2. **Lint-clean loop** — lint → fix → relint. *Stops:* zero warnings. `Run LINTER on FILE, fix all warnings, rerun until clean (max 5).`
3. **Bug-narrow loop** — reproduce → remove half the code → still breaks? *Stops:* minimal reproduction. `Reproduce BUG, then repeatedly halve the example while it still fails, until minimal.`
4. **Safe-refactor loop** — one small refactor → tests must stay green → next. *Stops:* checklist done. `Refactor GOAL in smallest steps; after each, run tests; revert any step that breaks them.`
5. **Docs-sync loop** — diff code vs docs → patch docs. *Stops:* no drift found. `Compare MODULE with its docs, fix one mismatch, recheck (max 6).`
6. **Review loop** — agent reviews diff → fixes applied → re-review. *Stops:* no blocking comments. `Review this DIFF as a strict senior; I'll fix; re-review until you find nothing blocking (max 4 rounds).`
7. **Dependency loop** — bump one package → test → keep or revert → next. *Stops:* list exhausted. `For each outdated package: bump, test, keep if green else revert and note why.`
8. **Performance loop** — measure → optimize one hotspot → re-measure. *Stops:* target met. `Profile SCRIPT, improve the single slowest part, re-profile, until under TARGET_MS (max 5).`
9. **Type-coverage loop** — add types to one file → typecheck. *Stops:* checker silent. `Add types file-by-file; run the type checker after each; stop at zero errors.`
10. **Migration loop** — convert one module → verify → next. *Stops:* all modules moved. `Migrate one module from OLD to NEW, verify behavior unchanged, update the state list, continue.`

### B. Writing & Content (11–17)
11. **Draft-critic loop** — draft → score against rubric → revise. *Stops:* score ≥ 8/10. `Draft X. Then grade it vs RUBRIC out of 10 with reasons. Revise weakest point. Repeat until ≥8 (max 4).`
12. **Simplify loop** — rewrite → readability check. *Stops:* target grade level. `Rewrite TEXT for a 12-year-old; estimate reading level; repeat until level ≤ 6.`
13. **Headline loop** — 10 options → score → mutate best. *Stops:* 3 rounds. `Write 10 titles for X, rank them, generate 10 variants of the winner, rank again — 3 rounds, show final 3.`
14. **Back-translation loop** — translate → translate back → compare. *Stops:* meaning matches. `Translate to LANG, back to English, list meaning drift, fix, repeat until no drift (max 3).`
15. **Claim-check loop** — extract claims → verify each. *Stops:* all sourced or flagged. `List every factual claim in DRAFT; mark verified/unverified with sources; rewrite unverified ones; recheck.`
16. **Voice-match loop** — rewrite vs sample → compare. *Stops:* match confirmed. `Rewrite TEXT in the voice of SAMPLE; list 3 differences remaining; fix; repeat until none (max 4).`
17. **Post-rules loop** — draft → check house rules. *Stops:* all rules pass. `Draft the post; check: hook in line 1, ≤ N chars, 1 CTA, no banned words; fix violations; recheck.`

### C. Study & Learning (18–23)
18. **Flashcard loop** — quiz → wrong cards return to deck. *Stops:* deck empty. `Quiz me on TOPIC one card at a time; wrong answers go back in the pile; end when I clear it.`
19. **Feynman loop** — I explain → you find gaps → I retry. *Stops:* no gaps found. `I'll explain TOPIC; point out exactly one gap or error; I re-explain; repeat until you find none.`
20. **Problem-set loop** — solve → check → hint → retry. *Stops:* correct. `Give me one PROBLEM; check my answer; if wrong give one hint (not the answer); repeat.`
21. **Vocabulary loop** — use word → grade → retry. *Stops:* natural usage. `Give me a new Urdu/English word; I use it in a sentence; grade naturalness /10; retry until 8+.`
22. **Interview loop** — answer → scored feedback → re-answer. *Stops:* score target. `Ask me one QUESTION_TYPE interview question; score my answer /10 with two fixes; I retry until 8+.`
23. **Shrink loop** — summarize → halve → check nothing vital lost. *Stops:* one sentence left. `Summarize TEXT; halve it; confirm no key idea lost; repeat until one sentence.`

### D. Business & Ops (24–29)
24. **Inbox-triage loop** — classify → draft or archive → human approves batch. *Stops:* inbox empty. *Human gate: nothing sends without approval.*
25. **Lead-qualify loop** — score vs checklist → request missing info → rescore. *Stops:* qualified or disqualified.
26. **Report-verify loop** — build report → checker recomputes totals → fix. *Stops:* numbers match. `Build the report from DATA; independently recompute every total; fix mismatches; recheck (max 3).`
27. **SOP loop** — run procedure → log friction → revise SOP. *Stops:* one clean run. (Outer loop: monthly.)
28. **Price-watch loop** — fetch competitor prices → compare to band → alert. *Stops:* never (scheduled loop with per-run cap).
29. **Minutes loop** — draft minutes → check every agenda item covered → fill gaps. *Stops:* full coverage. `Draft minutes from NOTES; verify each AGENDA item has a decision or action; fill gaps; recheck.`

### E. Data & Research (30–35)
30. **Data-clean loop** — validate rows → fix violations → revalidate. *Stops:* zero errors. `Check DATA against RULES; fix one violation type at a time; revalidate until clean (max 6).`
31. **Query-refine loop** — search → judge coverage → refine → search. *Stops:* no new info in 2 rounds.
32. **Triangulate loop** — claim → find 2 independent sources. *Stops:* confirmed or marked unverified. `For each CLAIM, find two independent sources or label it unverified — never a third option.`
33. **Label-bootstrap loop** — model labels sample → human corrects → model relabels all. *Stops:* agreement ≥ 95%.
34. **Experiment loop (hill climb)** — change one variable → run → keep if metric improves. *Stops:* N runs or plateau.
35. **Theme loop** — cluster responses → name themes → check coverage → merge/split. *Stops:* stable two rounds.

### F. Personal & Home (36–41)
36. **Meal-plan loop** — propose week → check budget + diet rules → swap violations. *Stops:* all rules pass.
37. **Budget loop** — categorize spending → compare limits → suggest ONE cut. *Stops:* monthly (scheduled).
38. **Trip loop** — draft itinerary → check time/cost/energy limits → fix. *Stops:* all constraints met.
39. **Habit loop** — daily check-in → streak logic → adjust difficulty weekly. *Stops:* never (that's the point).
40. **Declutter loop** — one shelf → keep/donate rule → check done → next shelf. *Stops:* room list empty.
41. **The chai loop** — taste → adjust → taste. *Stops:* perfect. The original. ☕

---

## Part 12 — Designing Loops with Claude Fable 5

*(Fact-checked against Anthropic's pages and platform docs, July 2026 — pricing and limits change, so re-verify before teaching.)*

**What it is:** Claude Fable 5 (released June 9, 2026) is Anthropic's first generally available "Mythos-class" model — the same core model as the restricted Claude Mythos 5, plus safety classifiers so it can be offered broadly. It's positioned specifically for long-horizon agentic work: in an agent harness it can run for days, planning across stages, delegating to sub-agents, tracking dependencies, and checking its own work — tasks where earlier models needed frequent human check-ins.

**The specs that matter for loop design** (approximate — verify at anthropic.com/docs):
- Model ID: `claude-fable-5` · ~1M token context, ~128K output
- Pricing: ~$10 / $50 per million input/output tokens — roughly double Opus 4.8
- Adaptive thinking with effort levels (low → xhigh)
- Safety classifiers can return `stop_reason: "refusal"` on sensitive domains — production loops need refusal handling and a fallback model (e.g., Opus 4.8)

**What this changes about your loops:**
1. **Longer inner loops become viable.** Where older models drifted after 10–20 cycles, Fable-class models hold goals across far longer horizons — so the safety stop, not model confusion, becomes your main brake. Set it deliberately.
2. **Cost discipline is now a design input, not an afterthought.** At double Opus pricing, a loop that fans one instruction into dozens of calls burns money fast. Rules of thumb: route routine cycles to a cheaper model (Sonnet/Haiku) and reserve Fable 5 for the hard reasoning steps; set a per-run token budget as a halt condition; use lower effort levels for mechanical cycles.
3. **Self-verification helps but doesn't replace your verifier.** Fable 5 at high effort reflects on and validates its own work — treat that as a free first-pass check, and keep your independent verifier (tests, rules, a second grader) as the real gate.
4. **Design for refusals as a recovery path.** A loop step can come back refused (HTTP 200, `stop_reason: "refusal"`). Your recovery path: retry on a fallback model, or escalate to a human — never silently drop the step.
5. **Sub-agent delegation is a loop-within-loop.** Fable 5 can spawn sub-agents; each sub-agent needs its own halt conditions and budget, or one runaway child burns the parent's budget.

**Beginner takeaway for your students:** better models don't make loop engineering obsolete — they make it MORE important, because the loops run longer, touch more, and cost more per mistake.

---

## Part 13 — Where Loops Fail, What They Cost, and the Three Debts

### The honest cost sheet
Publicly reported figures (approximate — verify against your own runs):
- **Money:** looped workflows commonly cost several times (reports say ~3–10×) an equivalent single prompt chain, because every cycle re-sends context. Budget caps are mandatory, not optional.
- **Time:** 5–20 iterations at a few seconds each means many seconds to minutes per run — fine for background work, wrong for anything a user is waiting on.
- **Complexity:** state schemas, traces, verifiers, and evaluation are real engineering. A loop is infrastructure you now own.
- **Model dependency:** loop convergence quality tracks model reasoning ability — the same loop that converges on a frontier model can stall forever on a weak one.

### The three debts (they get worse the BETTER the loop works)
*The "debts" framing circulates in the community; the specific three below are my own formulation.*

1. **Verification debt.** The more reliably a loop ships, the less you check its output — and the weaker your verifier quietly is, the more garbage passes with a green tick. Success reduces scrutiny; reduced scrutiny hides verifier gaps; the gap compounds every unreviewed run. *Pay it down:* schedule random human audits of "passing" runs, forever.
2. **Comprehension debt.** Loops produce code, documents, and decisions faster than any human reads them. It feels free — until the day something breaks and the person debugging has never actually understood what the system built. *Pay it down:* the weekly trace review (Step 14) exists precisely so a human keeps a mental model of what the loops made.
3. **Harness debt.** Every prompt, state schema, grader, and API call in your loop rots as models, prices, and endpoints change underneath it. The more loops you run, the bigger the invisible maintenance surface. *Pay it down:* fewer, better loops; version your harnesses; re-run your evaluation suite whenever you swap models.

**The one-line summary of this whole part:** a loop transfers your effort from *doing the work* to *defining correct and auditing the machine* — and the debts are what happens when you skip the auditing half.

---

## Sources & honesty notes

This guide is based on July 2026 reporting and posts around the loop-engineering trend: coverage of Boris Cherny's and Peter Steinberger's viral statements, Andrew Ng's three-loop framing on X/DeepLearning.AI, Addy Osmani's "Loop Engineering" post, LangChain's "The Art of Loop Engineering" blog, and explainers from TechTalks, ADTMag, and MindStudio. The ReAct pattern comes from Princeton/Google research (Yao et al.). The field is moving fast — re-verify names, tools, and framings before teaching them as current facts.

**On Parts 10–13:** the "14-step roadmap," "loop catalog," and "three debts" concepts echo structures popularized in mid-2026 community posts (including a paywalled guide by Linas Beliūnas and public threads by Lev Deviatkin and others). The specific steps, all 41 catalog entries, and the three-debt formulation in THIS guide are original — written fresh so you can teach and share them freely. Claude Fable 5 facts are sourced from Anthropic's announcement, the Fable model page, platform docs, and third-party coverage (June–July 2026); re-verify pricing and limits before quoting them.

*Built for littleBuildrs / AI Baithak teaching use. Pair with `loop-engineering-playground.html`.*