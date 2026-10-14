import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierBaselineEngine } from "./tier-baseline-engine.js";
import { newTierBaseline } from "./tier-baseline.js";

test("TierBaselineEngine keeps results within bounds", () => {
  const engine = defaultTierBaselineEngine();
  const item = newTierBaseline("code-578", "label-341");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
