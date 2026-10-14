import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredEscalationSummaryEngine } from "./tiered-escalation-summary-engine.js";
import { newTieredEscalationSummary } from "./tiered-escalation-summary.js";

test("TieredEscalationSummaryEngine keeps results within bounds", () => {
  const engine = defaultTieredEscalationSummaryEngine();
  const item = newTieredEscalationSummary("code-990", "label-221");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
