import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalDoubleOptInSlot } from "./seasonal-double-opt-in-slot.js";

test("SeasonalDoubleOptInSlot starts in draft", () => {
  const item = newSeasonalDoubleOptInSlot("code-758", "name-183");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalDoubleOptInSlot moves to pending", () => {
  const item = newSeasonalDoubleOptInSlot("code-758", "name-183");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalDoubleOptInSlot rejects moves from closed", () => {
  const item = newSeasonalDoubleOptInSlot("code-758", "name-183");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
