import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDomainSummaryEngine } from "./domain-summary-engine.js";
import { newDomainSummary } from "./domain-summary.js";

test("DomainSummaryEngine keeps results within bounds", () => {
  const engine = defaultDomainSummaryEngine();
  const item = newDomainSummary("code-178", "title-853");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
