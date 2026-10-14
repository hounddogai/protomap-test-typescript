import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultChallengeAssignmentEngine } from "./challenge-assignment-engine.js";
import { newChallengeAssignment } from "./challenge-assignment.js";

test("ChallengeAssignmentEngine keeps results within bounds", () => {
  const engine = defaultChallengeAssignmentEngine(flags.newRegistry());
  const item = newChallengeAssignment("code-785", "name-561");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
