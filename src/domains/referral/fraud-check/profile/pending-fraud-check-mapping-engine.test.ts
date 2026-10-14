import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingFraudCheckMappingEngine } from "./pending-fraud-check-mapping-engine.js";
import { newPendingFraudCheckMapping } from "./pending-fraud-check-mapping.js";

test("PendingFraudCheckMappingEngine keeps results within bounds", () => {
  const engine = defaultPendingFraudCheckMappingEngine();
  const item = newPendingFraudCheckMapping("code-217", "label-614");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
