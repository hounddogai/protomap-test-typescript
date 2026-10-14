import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictPacingBaselineEngine } from "./strict-pacing-baseline-engine.js";
import { newStrictPacingBaseline } from "./strict-pacing-baseline.js";

test("StrictPacingBaselineEngine keeps results within bounds", () => {
  const engine = defaultStrictPacingBaselineEngine(flags.newRegistry());
  const item = newStrictPacingBaseline("code-773", "label-202");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
