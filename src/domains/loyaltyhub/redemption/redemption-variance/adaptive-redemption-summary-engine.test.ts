import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveRedemptionSummaryEngine } from "./adaptive-redemption-summary-engine.js";
import { newAdaptiveRedemptionSummary } from "./adaptive-redemption-summary.js";

test("AdaptiveRedemptionSummaryEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveRedemptionSummaryEngine();
  const item = newAdaptiveRedemptionSummary("code-624", "title-237");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
