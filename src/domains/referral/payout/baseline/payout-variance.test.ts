import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutVariance } from "./payout-variance.js";

test("PayoutVariance starts in new", () => {
  const item = newPayoutVariance("code-803", "title-950");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutVariance moves to queued", () => {
  const item = newPayoutVariance("code-803", "title-950");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PayoutVariance rejects moves from failed", () => {
  const item = newPayoutVariance("code-803", "title-950");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
