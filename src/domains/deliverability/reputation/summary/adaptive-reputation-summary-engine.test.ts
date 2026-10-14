import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveReputationSummaryEngine } from "./adaptive-reputation-summary-engine.js";
import { newAdaptiveReputationSummary } from "./adaptive-reputation-summary.js";

test("AdaptiveReputationSummaryEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveReputationSummaryEngine();
  const item = newAdaptiveReputationSummary("code-118", "title-504");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
