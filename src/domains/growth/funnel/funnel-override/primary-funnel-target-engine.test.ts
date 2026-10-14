import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryFunnelTargetEngine } from "./primary-funnel-target-engine.js";
import { newPrimaryFunnelTarget } from "./primary-funnel-target.js";

test("PrimaryFunnelTargetEngine keeps results within bounds", () => {
  const engine = defaultPrimaryFunnelTargetEngine();
  const item = newPrimaryFunnelTarget("code-699", "label-793");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
