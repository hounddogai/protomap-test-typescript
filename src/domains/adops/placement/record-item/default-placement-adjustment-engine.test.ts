import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultPlacementAdjustmentEngine } from "./default-placement-adjustment-engine.js";
import { newDefaultPlacementAdjustment } from "./default-placement-adjustment.js";

test("DefaultPlacementAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultDefaultPlacementAdjustmentEngine();
  const item = newDefaultPlacementAdjustment("code-655", "label-587");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
