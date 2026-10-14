import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredCohortSummaryEngine } from "./tiered-cohort-summary-engine.js";
import { newTieredCohortSummary } from "./tiered-cohort-summary.js";

test("TieredCohortSummaryEngine keeps results within bounds", () => {
  const engine = defaultTieredCohortSummaryEngine(flags.newRegistry());
  const item = newTieredCohortSummary("code-276", "title-463");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
