import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictReputationSummaryEngine } from "./strict-reputation-summary-engine.js";
import { newStrictReputationSummary } from "./strict-reputation-summary.js";

test("StrictReputationSummaryEngine keeps results within bounds", () => {
  const engine = defaultStrictReputationSummaryEngine(flags.newRegistry());
  const item = newStrictReputationSummary("code-150", "title-58");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
