import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyRewardSlot } from "./legacy-reward-slot.js";

test("LegacyRewardSlot starts in planned", () => {
  const item = newLegacyRewardSlot("code-588", "name-828");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyRewardSlot moves to scheduled", () => {
  const item = newLegacyRewardSlot("code-588", "name-828");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LegacyRewardSlot rejects moves from cancelled", () => {
  const item = newLegacyRewardSlot("code-588", "name-828");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
