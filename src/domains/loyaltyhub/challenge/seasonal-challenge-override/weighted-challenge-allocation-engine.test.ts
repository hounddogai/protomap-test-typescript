import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedChallengeAllocationEngine } from "./weighted-challenge-allocation-engine.js";
import { newWeightedChallengeAllocation } from "./weighted-challenge-allocation.js";

test("WeightedChallengeAllocationEngine keeps results within bounds", () => {
  const engine = defaultWeightedChallengeAllocationEngine(flags.newRegistry());
  const item = newWeightedChallengeAllocation("code-698", "title-49");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
