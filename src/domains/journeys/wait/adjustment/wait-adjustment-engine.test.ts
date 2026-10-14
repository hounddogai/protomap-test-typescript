import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWaitAdjustmentEngine } from "./wait-adjustment-engine.js";
import { newWaitAdjustment } from "./wait-adjustment.js";

test("WaitAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultWaitAdjustmentEngine(flags.newRegistry());
  const item = newWaitAdjustment("code-549", "name-798");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
