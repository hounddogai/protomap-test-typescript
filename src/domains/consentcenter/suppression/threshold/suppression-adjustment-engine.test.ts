import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSuppressionAdjustmentEngine } from "./suppression-adjustment-engine.js";
import { newSuppressionAdjustment } from "./suppression-adjustment.js";

test("SuppressionAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultSuppressionAdjustmentEngine(flags.newRegistry());
  const item = newSuppressionAdjustment("code-313", "title-391");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
