import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutPlan } from "./payout-plan.js";

test("PayoutPlan starts in requested", () => {
  const item = newPayoutPlan("code-66", "name-361");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutPlan moves to granted", () => {
  const item = newPayoutPlan("code-66", "name-361");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PayoutPlan rejects moves from expired", () => {
  const item = newPayoutPlan("code-66", "name-361");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
