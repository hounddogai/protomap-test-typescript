import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingPayoutLedger } from "./pending-payout-ledger.js";

test("PendingPayoutLedger starts in new", () => {
  const item = newPendingPayoutLedger("code-230", "label-275");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingPayoutLedger moves to running", () => {
  const item = newPendingPayoutLedger("code-230", "label-275");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PendingPayoutLedger rejects moves from failed", () => {
  const item = newPendingPayoutLedger("code-230", "label-275");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
