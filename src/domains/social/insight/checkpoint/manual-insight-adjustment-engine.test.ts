import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualInsightAdjustmentEngine } from "./manual-insight-adjustment-engine.js";
import { newManualInsightAdjustment } from "./manual-insight-adjustment.js";

test("ManualInsightAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultManualInsightAdjustmentEngine(flags.newRegistry());
  const item = newManualInsightAdjustment("code-685", "title-38");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
