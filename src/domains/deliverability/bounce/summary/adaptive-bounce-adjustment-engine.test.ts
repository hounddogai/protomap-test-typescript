import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveBounceAdjustmentEngine } from "./adaptive-bounce-adjustment-engine.js";
import { newAdaptiveBounceAdjustment } from "./adaptive-bounce-adjustment.js";

test("AdaptiveBounceAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveBounceAdjustmentEngine();
  const item = newAdaptiveBounceAdjustment("code-575", "label-713");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
