export type {
  ActivityType,
  CheckpointType,
  Tier,
  LessonActivity,
  RealAI,
  Checkpoint,
  Lesson,
} from "./types.ts";
export { REQUIRED_STRING_SUFFIXES } from "./types.ts";
export { L1, L2, L3, L4, L5, L6, LESSONS } from "./lessons.ts";
export {
  getLessons,
  getLesson,
  resolveStrings,
  validateLesson,
  buildSimulationLoop,
  type ResolvedLessonStrings,
} from "./loader.ts";
export { getVerifier, hasVerifier, registerVerifier } from "./verifier-registry.ts";
