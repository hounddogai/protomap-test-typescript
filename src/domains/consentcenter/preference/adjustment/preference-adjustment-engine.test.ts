import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPreferenceAdjustmentEngine } from "./preference-adjustment-engine.js";
import { newPreferenceAdjustment } from "./preference-adjustment.js";

test("PreferenceAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultPreferenceAdjustmentEngine();
  const item = newPreferenceAdjustment("code-629", "title-690");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
