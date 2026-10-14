import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveWaitAdjustmentEngine } from "./adaptive-wait-adjustment-engine.js";
import { newAdaptiveWaitAdjustment } from "./adaptive-wait-adjustment.js";

test("AdaptiveWaitAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveWaitAdjustmentEngine(flags.newRegistry());
  const item = newAdaptiveWaitAdjustment("code-973", "name-187");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
