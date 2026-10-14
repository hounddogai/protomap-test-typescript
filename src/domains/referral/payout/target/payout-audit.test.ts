import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutAudit } from "./payout-audit.js";

test("PayoutAudit starts in proposed", () => {
  const item = newPayoutAudit("code-240", "name-446");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutAudit moves to approved", () => {
  const item = newPayoutAudit("code-240", "name-446");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PayoutAudit rejects moves from withdrawn", () => {
  const item = newPayoutAudit("code-240", "name-446");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
