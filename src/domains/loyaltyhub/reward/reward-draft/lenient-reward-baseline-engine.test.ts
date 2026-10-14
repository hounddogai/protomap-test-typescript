import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientRewardBaselineEngine } from "./lenient-reward-baseline-engine.js";
import { newLenientRewardBaseline } from "./lenient-reward-baseline.js";

test("LenientRewardBaselineEngine keeps results within bounds", () => {
  const engine = defaultLenientRewardBaselineEngine();
  const item = newLenientRewardBaseline("code-937", "label-120");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
