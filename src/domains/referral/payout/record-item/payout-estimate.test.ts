import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutEstimate } from "./payout-estimate.js";

test("PayoutEstimate starts in requested", () => {
  const item = newPayoutEstimate("code-267", "name-526");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutEstimate moves to granted", () => {
  const item = newPayoutEstimate("code-267", "name-526");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PayoutEstimate rejects moves from expired", () => {
  const item = newPayoutEstimate("code-267", "name-526");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
