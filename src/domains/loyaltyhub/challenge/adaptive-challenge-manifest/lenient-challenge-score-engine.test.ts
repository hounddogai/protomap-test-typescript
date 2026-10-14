import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientChallengeScoreEngine } from "./lenient-challenge-score-engine.js";
import { newLenientChallengeScore } from "./lenient-challenge-score.js";

test("LenientChallengeScoreEngine keeps results within bounds", () => {
  const engine = defaultLenientChallengeScoreEngine(flags.newRegistry());
  const item = newLenientChallengeScore("code-899", "name-480");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
