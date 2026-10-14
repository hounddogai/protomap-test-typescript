import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryFraudCheckClaim } from "./primary-fraud-check-claim.js";

test("PrimaryFraudCheckClaim starts in planned", () => {
  const item = newPrimaryFraudCheckClaim("code-624", "label-100");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryFraudCheckClaim moves to completed", () => {
  const item = newPrimaryFraudCheckClaim("code-624", "label-100");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PrimaryFraudCheckClaim rejects moves from cancelled", () => {
  const item = newPrimaryFraudCheckClaim("code-624", "label-100");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
