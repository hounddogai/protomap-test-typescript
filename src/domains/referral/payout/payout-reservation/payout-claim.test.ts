import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutClaim } from "./payout-claim.js";

test("PayoutClaim starts in created", () => {
  const item = newPayoutClaim("code-583", "label-738");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutClaim moves to validated", () => {
  const item = newPayoutClaim("code-583", "label-738");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PayoutClaim rejects moves from retired", () => {
  const item = newPayoutClaim("code-583", "label-738");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
