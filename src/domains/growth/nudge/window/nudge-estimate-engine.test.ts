import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultNudgeEstimateEngine } from "./nudge-estimate-engine.js";
import { newNudgeEstimate } from "./nudge-estimate.js";

test("NudgeEstimateEngine keeps results within bounds", () => {
  const engine = defaultNudgeEstimateEngine();
  const item = newNudgeEstimate("code-244", "label-847");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
