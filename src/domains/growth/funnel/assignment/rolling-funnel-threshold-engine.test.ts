import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingFunnelThresholdEngine } from "./rolling-funnel-threshold-engine.js";
import { newRollingFunnelThreshold } from "./rolling-funnel-threshold.js";

test("RollingFunnelThresholdEngine keeps results within bounds", () => {
  const engine = defaultRollingFunnelThresholdEngine();
  const item = newRollingFunnelThreshold("code-852", "title-941");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
