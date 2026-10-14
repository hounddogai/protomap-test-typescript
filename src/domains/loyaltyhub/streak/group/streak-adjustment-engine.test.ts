import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStreakAdjustmentEngine } from "./streak-adjustment-engine.js";
import { newStreakAdjustment } from "./streak-adjustment.js";

test("StreakAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultStreakAdjustmentEngine(flags.newRegistry());
  const item = newStreakAdjustment("code-598", "name-54");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
