import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedSuppressionAgreementEngine } from "./batched-suppression-agreement-engine.js";
import { newBatchedSuppressionAgreement } from "./batched-suppression-agreement.js";

test("BatchedSuppressionAgreementEngine keeps results within bounds", () => {
  const engine = defaultBatchedSuppressionAgreementEngine();
  const item = newBatchedSuppressionAgreement("code-203", "name-864");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
