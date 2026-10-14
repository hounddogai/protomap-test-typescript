import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalNudgeSummaryEngine } from "./regional-nudge-summary-engine.js";
import { newRegionalNudgeSummary } from "./regional-nudge-summary.js";

test("RegionalNudgeSummaryEngine keeps results within bounds", () => {
  const engine = defaultRegionalNudgeSummaryEngine(flags.newRegistry());
  const item = newRegionalNudgeSummary("code-72", "title-350");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
