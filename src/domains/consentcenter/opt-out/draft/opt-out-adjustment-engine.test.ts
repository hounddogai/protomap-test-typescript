import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultOptOutAdjustmentEngine } from "./opt-out-adjustment-engine.js";
import { newOptOutAdjustment } from "./opt-out-adjustment.js";

test("OptOutAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultOptOutAdjustmentEngine(flags.newRegistry());
  const item = newOptOutAdjustment("code-807", "name-694");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
