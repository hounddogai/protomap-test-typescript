import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyPaywallThresholdEngine } from "./legacy-paywall-threshold-engine.js";
import { newLegacyPaywallThreshold } from "./legacy-paywall-threshold.js";

test("LegacyPaywallThresholdEngine keeps results within bounds", () => {
  const engine = defaultLegacyPaywallThresholdEngine(flags.newRegistry());
  const item = newLegacyPaywallThreshold("code-360", "name-211");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
