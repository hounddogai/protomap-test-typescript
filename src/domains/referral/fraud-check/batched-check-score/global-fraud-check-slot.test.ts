import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalFraudCheckSlot } from "./global-fraud-check-slot.js";

test("GlobalFraudCheckSlot starts in proposed", () => {
  const item = newGlobalFraudCheckSlot("code-207", "title-168");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalFraudCheckSlot moves to rejected", () => {
  const item = newGlobalFraudCheckSlot("code-207", "title-168");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("GlobalFraudCheckSlot rejects moves from withdrawn", () => {
  const item = newGlobalFraudCheckSlot("code-207", "title-168");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
