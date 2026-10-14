import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPayoutPreference } from "./lenient-payout-preference.js";

test("LenientPayoutPreference starts in planned", () => {
  const item = newLenientPayoutPreference("code-621", "name-254");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPayoutPreference moves to scheduled", () => {
  const item = newLenientPayoutPreference("code-621", "name-254");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientPayoutPreference rejects moves from cancelled", () => {
  const item = newLenientPayoutPreference("code-621", "name-254");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
