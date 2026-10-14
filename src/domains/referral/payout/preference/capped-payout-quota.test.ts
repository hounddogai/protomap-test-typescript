import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedPayoutQuota } from "./capped-payout-quota.js";

test("CappedPayoutQuota starts in new", () => {
  const item = newCappedPayoutQuota("code-345", "label-172");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedPayoutQuota moves to queued", () => {
  const item = newCappedPayoutQuota("code-345", "label-172");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CappedPayoutQuota rejects moves from failed", () => {
  const item = newCappedPayoutQuota("code-345", "label-172");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
