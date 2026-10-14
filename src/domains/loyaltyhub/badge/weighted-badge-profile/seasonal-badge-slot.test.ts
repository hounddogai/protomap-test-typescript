import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalBadgeSlot } from "./seasonal-badge-slot.js";

test("SeasonalBadgeSlot starts in planned", () => {
  const item = newSeasonalBadgeSlot("code-38", "name-638");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalBadgeSlot moves to scheduled", () => {
  const item = newSeasonalBadgeSlot("code-38", "name-638");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SeasonalBadgeSlot rejects moves from cancelled", () => {
  const item = newSeasonalBadgeSlot("code-38", "name-638");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
