import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictReputationTierEngine } from "./strict-reputation-tier-engine.js";
import { newStrictReputationTier } from "./strict-reputation-tier.js";

test("StrictReputationTierEngine keeps results within bounds", () => {
  const engine = defaultStrictReputationTierEngine();
  const item = newStrictReputationTier("code-788", "label-923");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
