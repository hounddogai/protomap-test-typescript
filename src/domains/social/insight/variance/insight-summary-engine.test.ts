import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInsightSummaryEngine } from "./insight-summary-engine.js";
import { newInsightSummary } from "./insight-summary.js";

test("InsightSummaryEngine keeps results within bounds", () => {
  const engine = defaultInsightSummaryEngine(flags.newRegistry());
  const item = newInsightSummary("code-121", "label-195");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
