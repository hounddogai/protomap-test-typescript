import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutSegment } from "./payout-segment.js";

test("PayoutSegment starts in proposed", () => {
  const item = newPayoutSegment("code-901", "label-555");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutSegment moves to rejected", () => {
  const item = newPayoutSegment("code-901", "label-555");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PayoutSegment rejects moves from withdrawn", () => {
  const item = newPayoutSegment("code-901", "label-555");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
