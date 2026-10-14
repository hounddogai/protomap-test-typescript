import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedFlightAgreementEngine } from "./batched-flight-agreement-engine.js";
import { newBatchedFlightAgreement } from "./batched-flight-agreement.js";

test("BatchedFlightAgreementEngine keeps results within bounds", () => {
  const engine = defaultBatchedFlightAgreementEngine();
  const item = newBatchedFlightAgreement("code-665", "name-831");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
