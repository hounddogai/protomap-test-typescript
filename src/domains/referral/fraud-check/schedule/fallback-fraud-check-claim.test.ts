import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFraudCheckClaim } from "./fallback-fraud-check-claim.js";

test("FallbackFraudCheckClaim starts in requested", () => {
  const item = newFallbackFraudCheckClaim("code-228", "title-892");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFraudCheckClaim moves to expired", () => {
  const item = newFallbackFraudCheckClaim("code-228", "title-892");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("FallbackFraudCheckClaim rejects moves from expired", () => {
  const item = newFallbackFraudCheckClaim("code-228", "title-892");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
