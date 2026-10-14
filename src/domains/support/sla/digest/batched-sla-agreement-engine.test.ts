import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedSlaAgreementEngine } from "./batched-sla-agreement-engine.js";
import { newBatchedSlaAgreement } from "./batched-sla-agreement.js";

test("BatchedSlaAgreementEngine keeps results within bounds", () => {
  const engine = defaultBatchedSlaAgreementEngine();
  const item = newBatchedSlaAgreement("code-133", "label-36");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
