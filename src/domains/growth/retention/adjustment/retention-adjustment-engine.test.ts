import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionAdjustmentEngine } from "./retention-adjustment-engine.js";
import { newRetentionAdjustment } from "./retention-adjustment.js";

test("RetentionAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultRetentionAdjustmentEngine(flags.newRegistry());
  const item = newRetentionAdjustment("code-922", "title-705");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
