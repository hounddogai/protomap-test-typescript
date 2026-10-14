import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFrequencyAdjustmentEngine } from "./frequency-adjustment-engine.js";
import { newFrequencyAdjustment } from "./frequency-adjustment.js";

test("FrequencyAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultFrequencyAdjustmentEngine();
  const item = newFrequencyAdjustment("code-125", "name-117");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
