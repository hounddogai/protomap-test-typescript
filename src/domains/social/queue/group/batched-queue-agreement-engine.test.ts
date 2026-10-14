import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedQueueAgreementEngine } from "./batched-queue-agreement-engine.js";
import { newBatchedQueueAgreement } from "./batched-queue-agreement.js";

test("BatchedQueueAgreementEngine keeps results within bounds", () => {
  const engine = defaultBatchedQueueAgreementEngine();
  const item = newBatchedQueueAgreement("code-666", "name-478");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
