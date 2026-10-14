import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyPaywallMetricEngine } from "./legacy-paywall-metric-engine.js";
import { newLegacyPaywallMetric } from "./legacy-paywall-metric.js";

test("LegacyPaywallMetricEngine keeps results within bounds", () => {
  const engine = defaultLegacyPaywallMetricEngine();
  const item = newLegacyPaywallMetric("code-110", "title-392");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
