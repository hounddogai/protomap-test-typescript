import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFraudCheckRequestEngine } from "./fraud-check-request-engine.js";
import { newFraudCheckRequest } from "./fraud-check-request.js";

test("FraudCheckRequestEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckRequestEngine();
  const item = newFraudCheckRequest("code-873", "label-551");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
