import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveFunnelTargetEngine } from "./adaptive-funnel-target-engine.js";
import { newAdaptiveFunnelTarget } from "./adaptive-funnel-target.js";

test("AdaptiveFunnelTargetEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveFunnelTargetEngine();
  const item = newAdaptiveFunnelTarget("code-900", "name-204");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
