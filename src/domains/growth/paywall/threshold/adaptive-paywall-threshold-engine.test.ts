import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptivePaywallThresholdEngine } from "./adaptive-paywall-threshold-engine.js";
import { newAdaptivePaywallThreshold } from "./adaptive-paywall-threshold.js";

test("AdaptivePaywallThresholdEngine keeps results within bounds", () => {
  const engine = defaultAdaptivePaywallThresholdEngine();
  const item = newAdaptivePaywallThreshold("code-737", "name-117");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
