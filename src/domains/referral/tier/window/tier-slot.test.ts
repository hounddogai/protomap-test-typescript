import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierSlot } from "./tier-slot.js";

test("TierSlot starts in planned", () => {
  const item = newTierSlot("code-707", "label-532");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierSlot moves to in progress", () => {
  const item = newTierSlot("code-707", "label-532");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("TierSlot rejects moves from cancelled", () => {
  const item = newTierSlot("code-707", "label-532");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
