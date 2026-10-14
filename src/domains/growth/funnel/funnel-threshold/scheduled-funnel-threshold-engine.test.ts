import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledFunnelThresholdEngine } from "./scheduled-funnel-threshold-engine.js";
import { newScheduledFunnelThreshold } from "./scheduled-funnel-threshold.js";

test("ScheduledFunnelThresholdEngine keeps results within bounds", () => {
  const engine = defaultScheduledFunnelThresholdEngine(flags.newRegistry());
  const item = newScheduledFunnelThreshold("code-463", "title-477");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
