import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalEscalationSummaryEngine } from "./global-escalation-summary-engine.js";
import { newGlobalEscalationSummary } from "./global-escalation-summary.js";

test("GlobalEscalationSummaryEngine keeps results within bounds", () => {
  const engine = defaultGlobalEscalationSummaryEngine();
  const item = newGlobalEscalationSummary("code-162", "name-957");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
