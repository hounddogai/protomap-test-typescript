import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedProofTargetEngine } from "./weighted-proof-target-engine.js";
import { newWeightedProofTarget } from "./weighted-proof-target.js";

test("WeightedProofTargetEngine keeps results within bounds", () => {
  const engine = defaultWeightedProofTargetEngine();
  const item = newWeightedProofTarget("code-763", "title-728");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
