import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackFunnelEstimateEngine } from "./fallback-funnel-estimate-engine.js";
import { newFallbackFunnelEstimate } from "./fallback-funnel-estimate.js";

test("FallbackFunnelEstimateEngine keeps results within bounds", () => {
  const engine = defaultFallbackFunnelEstimateEngine(flags.newRegistry());
  const item = newFallbackFunnelEstimate("code-28", "label-869");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
