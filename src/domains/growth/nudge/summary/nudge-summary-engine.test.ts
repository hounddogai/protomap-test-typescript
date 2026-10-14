import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultNudgeSummaryEngine } from "./nudge-summary-engine.js";
import { newNudgeSummary } from "./nudge-summary.js";

test("NudgeSummaryEngine keeps results within bounds", () => {
  const engine = defaultNudgeSummaryEngine(flags.newRegistry());
  const item = newNudgeSummary("code-448", "name-672");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
