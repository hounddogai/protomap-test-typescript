import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStreakBaselineEngine } from "./streak-baseline-engine.js";
import { newStreakBaseline } from "./streak-baseline.js";

test("StreakBaselineEngine keeps results within bounds", () => {
  const engine = defaultStreakBaselineEngine(flags.newRegistry());
  const item = newStreakBaseline("code-507", "name-12");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
