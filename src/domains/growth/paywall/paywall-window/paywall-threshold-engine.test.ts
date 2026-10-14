import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPaywallThresholdEngine } from "./paywall-threshold-engine.js";
import { newPaywallThreshold } from "./paywall-threshold.js";

test("PaywallThresholdEngine keeps results within bounds", () => {
  const engine = defaultPaywallThresholdEngine();
  const item = newPaywallThreshold("code-991", "label-809");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
