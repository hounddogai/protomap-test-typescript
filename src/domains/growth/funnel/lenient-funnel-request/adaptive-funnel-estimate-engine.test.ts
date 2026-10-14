import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveFunnelEstimateEngine } from "./adaptive-funnel-estimate-engine.js";
import { newAdaptiveFunnelEstimate } from "./adaptive-funnel-estimate.js";

test("AdaptiveFunnelEstimateEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveFunnelEstimateEngine(flags.newRegistry());
  const item = newAdaptiveFunnelEstimate("code-865", "title-268");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
