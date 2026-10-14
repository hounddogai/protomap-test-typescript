import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedWaitAdjustmentEngine } from "./capped-wait-adjustment-engine.js";
import { newCappedWaitAdjustment } from "./capped-wait-adjustment.js";

test("CappedWaitAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultCappedWaitAdjustmentEngine(flags.newRegistry());
  const item = newCappedWaitAdjustment("code-817", "title-130");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
