import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingOptOutAdjustmentEngine } from "./pending-opt-out-adjustment-engine.js";
import { newPendingOptOutAdjustment } from "./pending-opt-out-adjustment.js";

test("PendingOptOutAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultPendingOptOutAdjustmentEngine(flags.newRegistry());
  const item = newPendingOptOutAdjustment("code-169", "label-569");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
