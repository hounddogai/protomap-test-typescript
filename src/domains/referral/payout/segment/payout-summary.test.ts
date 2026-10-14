import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutSummary } from "./payout-summary.js";

test("PayoutSummary starts in requested", () => {
  const item = newPayoutSummary("code-928", "name-888");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutSummary moves to granted", () => {
  const item = newPayoutSummary("code-928", "name-888");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PayoutSummary rejects moves from expired", () => {
  const item = newPayoutSummary("code-928", "name-888");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
