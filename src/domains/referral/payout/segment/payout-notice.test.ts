import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutNotice } from "./payout-notice.js";

test("PayoutNotice starts in requested", () => {
  const item = newPayoutNotice("code-915", "label-385");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutNotice moves to granted", () => {
  const item = newPayoutNotice("code-915", "label-385");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PayoutNotice rejects moves from expired", () => {
  const item = newPayoutNotice("code-915", "label-385");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
