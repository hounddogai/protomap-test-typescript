import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackFunnelThresholdEngine } from "./fallback-funnel-threshold-engine.js";
import { newFallbackFunnelThreshold } from "./fallback-funnel-threshold.js";

test("FallbackFunnelThresholdEngine keeps results within bounds", () => {
  const engine = defaultFallbackFunnelThresholdEngine(flags.newRegistry());
  const item = newFallbackFunnelThreshold("code-49", "title-788");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
