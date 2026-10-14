import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultProofSummaryEngine } from "./proof-summary-engine.js";
import { newProofSummary } from "./proof-summary.js";

test("ProofSummaryEngine keeps results within bounds", () => {
  const engine = defaultProofSummaryEngine();
  const item = newProofSummary("code-350", "name-32");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
