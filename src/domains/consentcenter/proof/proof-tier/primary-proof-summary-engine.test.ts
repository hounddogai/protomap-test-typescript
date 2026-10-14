import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryProofSummaryEngine } from "./primary-proof-summary-engine.js";
import { newPrimaryProofSummary } from "./primary-proof-summary.js";

test("PrimaryProofSummaryEngine keeps results within bounds", () => {
  const engine = defaultPrimaryProofSummaryEngine();
  const item = newPrimaryProofSummary("code-463", "name-257");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
