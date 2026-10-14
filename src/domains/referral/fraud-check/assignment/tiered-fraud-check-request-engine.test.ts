import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredFraudCheckRequestEngine } from "./tiered-fraud-check-request-engine.js";
import { newTieredFraudCheckRequest } from "./tiered-fraud-check-request.js";

test("TieredFraudCheckRequestEngine keeps results within bounds", () => {
  const engine = defaultTieredFraudCheckRequestEngine(flags.newRegistry());
  const item = newTieredFraudCheckRequest("code-861", "label-234");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
