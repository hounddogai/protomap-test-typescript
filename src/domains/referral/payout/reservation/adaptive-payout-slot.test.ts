import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePayoutSlot } from "./adaptive-payout-slot.js";

test("AdaptivePayoutSlot starts in new", () => {
  const item = newAdaptivePayoutSlot("code-759", "title-758");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePayoutSlot moves to done", () => {
  const item = newAdaptivePayoutSlot("code-759", "title-758");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("AdaptivePayoutSlot rejects moves from failed", () => {
  const item = newAdaptivePayoutSlot("code-759", "title-758");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
