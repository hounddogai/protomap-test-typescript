import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredSuppressionEstimateEngine } from "./tiered-suppression-estimate-engine.js";
import { newTieredSuppressionEstimate } from "./tiered-suppression-estimate.js";

test("TieredSuppressionEstimateEngine keeps results within bounds", () => {
  const engine = defaultTieredSuppressionEstimateEngine(flags.newRegistry());
  const item = newTieredSuppressionEstimate("code-267", "name-36");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
