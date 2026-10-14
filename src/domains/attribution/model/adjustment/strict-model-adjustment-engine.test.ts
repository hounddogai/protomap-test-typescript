import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictModelAdjustmentEngine } from "./strict-model-adjustment-engine.js";
import { newStrictModelAdjustment } from "./strict-model-adjustment.js";

test("StrictModelAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultStrictModelAdjustmentEngine();
  const item = newStrictModelAdjustment("code-734", "name-576");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
