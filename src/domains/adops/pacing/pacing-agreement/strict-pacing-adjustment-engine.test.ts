import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictPacingAdjustmentEngine } from "./strict-pacing-adjustment-engine.js";
import { newStrictPacingAdjustment } from "./strict-pacing-adjustment.js";

test("StrictPacingAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultStrictPacingAdjustmentEngine(flags.newRegistry());
  const item = newStrictPacingAdjustment("code-513", "name-827");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
