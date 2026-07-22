import type { CycleContext, LoopSource } from "@loop-lab/loop-core";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** One real Groq chat call (OpenAI-compatible endpoint). Throws on non-200. */
export async function groqChat(key: string, model: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature: 0.4 }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      detail = body?.error?.message ?? "";
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(`Groq ${res.status}: ${detail.slice(0, 140) || res.statusText}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

function buildMessages(role: string, goal: string, memory: CycleContext["memory"]): ChatMessage[] {
  const msgs: ChatMessage[] = [
    {
      role: "system",
      content:
        `You are ${role}. Work toward the goal by iterating. Return ONLY the answer text — ` +
        `no preamble, no explanation. If told your last answer failed a check, fix exactly that.`,
    },
    { role: "user", content: goal },
  ];
  for (const rec of memory) {
    msgs.push({ role: "assistant", content: rec.candidate });
    if (rec.check && !rec.check.pass) {
      msgs.push({
        role: "user",
        content: `That answer failed the check: ${rec.check.reasons.join("; ")}. Fix only that and return only the answer.`,
      });
    }
  }
  return msgs;
}

/**
 * A real Groq-backed loop source that runs entirely in the browser with a BYO
 * key. One Groq call per cycle (in `reason`); the result is the candidate that
 * the loop's verifier then checks — a genuine reason→act→observe→check loop on
 * real model output, no backend required.
 */
export function groqBrowserSource(key: string, model: string, role: string): LoopSource<string> {
  let pending = "";
  return {
    label: "Groq",
    simulated: false,
    async reason(ctx: CycleContext<string>): Promise<string> {
      pending = await groqChat(key, model, buildMessages(role, ctx.goal, ctx.memory));
      return ctx.memory.length === 0
        ? "read the goal and draft a first answer"
        : "read the failed check and revise the answer";
    },
    act(): string {
      return pending;
    },
    observe(candidate: string): string {
      const words = candidate.split(/\s+/).filter(Boolean).length;
      return `produced a ${words}-word answer`;
    },
  };
}
