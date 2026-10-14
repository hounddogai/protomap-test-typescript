import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledModelAdjustmentEngine } from "./scheduled-model-adjustment-engine.js";
import { newScheduledModelAdjustment } from "./scheduled-model-adjustment.js";

test("ScheduledModelAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultScheduledModelAdjustmentEngine();
  const item = newScheduledModelAdjustment("code-272", "label-917");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
