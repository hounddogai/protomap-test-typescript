import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedStreakSummaryEngine } from "./weighted-streak-summary-engine.js";
import { newWeightedStreakSummary } from "./weighted-streak-summary.js";

test("WeightedStreakSummaryEngine keeps results within bounds", () => {
  const engine = defaultWeightedStreakSummaryEngine(flags.newRegistry());
  const item = newWeightedStreakSummary("code-873", "title-900");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
