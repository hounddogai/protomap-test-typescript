import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutBundle } from "./payout-bundle.js";

test("PayoutBundle starts in requested", () => {
  const item = newPayoutBundle("code-856", "label-68");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutBundle moves to expired", () => {
  const item = newPayoutBundle("code-856", "label-68");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("PayoutBundle rejects moves from expired", () => {
  const item = newPayoutBundle("code-856", "label-68");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
