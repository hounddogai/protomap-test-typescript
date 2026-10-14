import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFunnelAdjustmentEngine } from "./funnel-adjustment-engine.js";
import { newFunnelAdjustment } from "./funnel-adjustment.js";

test("FunnelAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultFunnelAdjustmentEngine(flags.newRegistry());
  const item = newFunnelAdjustment("code-536", "name-476");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
