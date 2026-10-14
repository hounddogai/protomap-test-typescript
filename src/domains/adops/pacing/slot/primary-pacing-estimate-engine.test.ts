import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryPacingEstimateEngine } from "./primary-pacing-estimate-engine.js";
import { newPrimaryPacingEstimate } from "./primary-pacing-estimate.js";

test("PrimaryPacingEstimateEngine keeps results within bounds", () => {
  const engine = defaultPrimaryPacingEstimateEngine();
  const item = newPrimaryPacingEstimate("code-907", "title-137");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
