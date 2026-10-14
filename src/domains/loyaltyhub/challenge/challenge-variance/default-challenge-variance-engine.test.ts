import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultChallengeVarianceEngine } from "./default-challenge-variance-engine.js";
import { newDefaultChallengeVariance } from "./default-challenge-variance.js";

test("DefaultChallengeVarianceEngine keeps results within bounds", () => {
  const engine = defaultDefaultChallengeVarianceEngine(flags.newRegistry());
  const item = newDefaultChallengeVariance("code-398", "name-788");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
