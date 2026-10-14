import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFraudCheckPolicy } from "./fallback-fraud-check-policy.js";

test("FallbackFraudCheckPolicy starts in planned", () => {
  const item = newFallbackFraudCheckPolicy("code-760", "name-796");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFraudCheckPolicy moves to in progress", () => {
  const item = newFallbackFraudCheckPolicy("code-760", "name-796");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("FallbackFraudCheckPolicy rejects moves from cancelled", () => {
  const item = newFallbackFraudCheckPolicy("code-760", "name-796");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
