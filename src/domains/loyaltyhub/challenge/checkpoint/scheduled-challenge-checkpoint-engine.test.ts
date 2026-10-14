import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledChallengeCheckpointEngine } from "./scheduled-challenge-checkpoint-engine.js";
import { newScheduledChallengeCheckpoint } from "./scheduled-challenge-checkpoint.js";

test("ScheduledChallengeCheckpointEngine keeps results within bounds", () => {
  const engine = defaultScheduledChallengeCheckpointEngine(flags.newRegistry());
  const item = newScheduledChallengeCheckpoint("code-8", "name-543");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
