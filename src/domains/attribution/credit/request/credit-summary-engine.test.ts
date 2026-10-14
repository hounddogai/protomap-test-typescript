import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreditSummaryEngine } from "./credit-summary-engine.js";
import { newCreditSummary } from "./credit-summary.js";

test("CreditSummaryEngine keeps results within bounds", () => {
  const engine = defaultCreditSummaryEngine();
  const item = newCreditSummary("code-810", "name-821");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
