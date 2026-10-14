import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedJourneyPolicyEngine } from "./batched-journey-policy-engine.js";
import { newBatchedJourneyPolicy } from "./batched-journey-policy.js";

test("BatchedJourneyPolicyEngine keeps results within bounds", () => {
  const engine = defaultBatchedJourneyPolicyEngine();
  const item = newBatchedJourneyPolicy("code-163", "title-543");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
