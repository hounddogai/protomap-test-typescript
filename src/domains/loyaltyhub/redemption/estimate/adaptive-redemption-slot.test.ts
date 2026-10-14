import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveRedemptionSlot } from "./adaptive-redemption-slot.js";

test("AdaptiveRedemptionSlot starts in open", () => {
  const item = newAdaptiveRedemptionSlot("code-627", "title-997");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveRedemptionSlot moves to resolved", () => {
  const item = newAdaptiveRedemptionSlot("code-627", "title-997");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("AdaptiveRedemptionSlot rejects moves from archived", () => {
  const item = newAdaptiveRedemptionSlot("code-627", "title-997");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
