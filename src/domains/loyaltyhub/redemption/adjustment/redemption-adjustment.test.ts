import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionAdjustment } from "./redemption-adjustment.js";

test("RedemptionAdjustment starts in planned", () => {
  const item = newRedemptionAdjustment("code-819", "name-22");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionAdjustment moves to in progress", () => {
  const item = newRedemptionAdjustment("code-819", "name-22");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RedemptionAdjustment rejects moves from cancelled", () => {
  const item = newRedemptionAdjustment("code-819", "name-22");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
