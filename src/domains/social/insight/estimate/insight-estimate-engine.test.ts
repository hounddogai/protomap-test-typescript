import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInsightEstimateEngine } from "./insight-estimate-engine.js";
import { newInsightEstimate } from "./insight-estimate.js";

test("InsightEstimateEngine keeps results within bounds", () => {
  const engine = defaultInsightEstimateEngine(flags.newRegistry());
  const item = newInsightEstimate("code-656", "label-450");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
