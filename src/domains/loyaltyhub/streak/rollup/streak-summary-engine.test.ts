import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStreakSummaryEngine } from "./streak-summary-engine.js";
import { newStreakSummary } from "./streak-summary.js";

test("StreakSummaryEngine keeps results within bounds", () => {
  const engine = defaultStreakSummaryEngine(flags.newRegistry());
  const item = newStreakSummary("code-901", "name-315");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
