import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredPacingAdjustmentEngine } from "./tiered-pacing-adjustment-engine.js";
import { newTieredPacingAdjustment } from "./tiered-pacing-adjustment.js";

test("TieredPacingAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultTieredPacingAdjustmentEngine();
  const item = newTieredPacingAdjustment("code-927", "label-231");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
