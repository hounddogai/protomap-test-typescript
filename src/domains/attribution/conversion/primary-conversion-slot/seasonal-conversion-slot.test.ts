import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalConversionSlot } from "./seasonal-conversion-slot.js";

test("SeasonalConversionSlot starts in open", () => {
  const item = newSeasonalConversionSlot("code-570", "name-869");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalConversionSlot moves to reopened", () => {
  const item = newSeasonalConversionSlot("code-570", "name-869");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SeasonalConversionSlot rejects moves from archived", () => {
  const item = newSeasonalConversionSlot("code-570", "name-869");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
