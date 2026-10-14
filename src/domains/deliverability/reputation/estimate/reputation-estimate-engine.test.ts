import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationEstimateEngine } from "./reputation-estimate-engine.js";
import { newReputationEstimate } from "./reputation-estimate.js";

test("ReputationEstimateEngine keeps results within bounds", () => {
  const engine = defaultReputationEstimateEngine(flags.newRegistry());
  const item = newReputationEstimate("code-60", "title-283");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
