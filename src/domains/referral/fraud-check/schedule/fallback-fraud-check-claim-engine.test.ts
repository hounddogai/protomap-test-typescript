import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackFraudCheckClaimEngine } from "./fallback-fraud-check-claim-engine.js";
import { newFallbackFraudCheckClaim } from "./fallback-fraud-check-claim.js";

test("FallbackFraudCheckClaimEngine keeps results within bounds", () => {
  const engine = defaultFallbackFraudCheckClaimEngine();
  const item = newFallbackFraudCheckClaim("code-228", "title-892");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
