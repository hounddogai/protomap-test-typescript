import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalFunnelSummaryEngine } from "./seasonal-funnel-summary-engine.js";
import { newSeasonalFunnelSummary } from "./seasonal-funnel-summary.js";

test("SeasonalFunnelSummaryEngine keeps results within bounds", () => {
  const engine = defaultSeasonalFunnelSummaryEngine();
  const item = newSeasonalFunnelSummary("code-520", "label-566");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
