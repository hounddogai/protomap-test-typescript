import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalMacroSlot } from "./seasonal-macro-slot.js";

test("SeasonalMacroSlot starts in planned", () => {
  const item = newSeasonalMacroSlot("code-952", "title-279");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalMacroSlot moves to in progress", () => {
  const item = newSeasonalMacroSlot("code-952", "title-279");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("SeasonalMacroSlot rejects moves from cancelled", () => {
  const item = newSeasonalMacroSlot("code-952", "title-279");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
