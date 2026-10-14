import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedJourneyAgreementEngine } from "./batched-journey-agreement-engine.js";
import { newBatchedJourneyAgreement } from "./batched-journey-agreement.js";

test("BatchedJourneyAgreementEngine keeps results within bounds", () => {
  const engine = defaultBatchedJourneyAgreementEngine(flags.newRegistry());
  const item = newBatchedJourneyAgreement("code-650", "name-305");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
