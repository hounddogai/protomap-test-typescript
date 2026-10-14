import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutOverride } from "./payout-override.js";

test("PayoutOverride starts in requested", () => {
  const item = newPayoutOverride("code-583", "name-686");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutOverride moves to revoked", () => {
  const item = newPayoutOverride("code-583", "name-686");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PayoutOverride rejects moves from expired", () => {
  const item = newPayoutOverride("code-583", "name-686");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
