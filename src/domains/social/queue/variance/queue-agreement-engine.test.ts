import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultQueueAgreementEngine } from "./queue-agreement-engine.js";
import { newQueueAgreement } from "./queue-agreement.js";

test("QueueAgreementEngine keeps results within bounds", () => {
  const engine = defaultQueueAgreementEngine();
  const item = newQueueAgreement("code-225", "label-169");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
