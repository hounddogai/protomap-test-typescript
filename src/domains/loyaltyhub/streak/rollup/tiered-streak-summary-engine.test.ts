import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredStreakSummaryEngine } from "./tiered-streak-summary-engine.js";
import { newTieredStreakSummary } from "./tiered-streak-summary.js";

test("TieredStreakSummaryEngine keeps results within bounds", () => {
  const engine = defaultTieredStreakSummaryEngine(flags.newRegistry());
  const item = newTieredStreakSummary("code-210", "name-831");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
