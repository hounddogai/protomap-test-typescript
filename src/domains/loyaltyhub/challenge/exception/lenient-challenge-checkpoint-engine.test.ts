import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientChallengeCheckpointEngine } from "./lenient-challenge-checkpoint-engine.js";
import { newLenientChallengeCheckpoint } from "./lenient-challenge-checkpoint.js";

test("LenientChallengeCheckpointEngine keeps results within bounds", () => {
  const engine = defaultLenientChallengeCheckpointEngine(flags.newRegistry());
  const item = newLenientChallengeCheckpoint("code-479", "label-335");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
