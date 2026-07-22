import type { Verifier } from "@loop-lab/verifiers";
import { equals, productDescription } from "@loop-lab/verifiers";

/**
 * Maps a lesson's `verifierRef` to a concrete verifier. Verifiers over
 * string candidates for now (the loop UI streams string candidates); typed
 * per-input verifiers can be added when non-string activities arrive.
 */
const registry: Record<string, Verifier<string>> = {
  productDescription,
  // L1's number game: the secret number is 32.
  secretNumber: equals("32"),
};

/** Register a verifier at runtime so a new lesson can ship as data + a verifier. */
export function registerVerifier(ref: string, verifier: Verifier<string>): void {
  registry[ref] = verifier;
}

export function getVerifier(ref: string): Verifier<string> | undefined {
  return registry[ref];
}

export function hasVerifier(ref: string): boolean {
  return ref in registry;
}
