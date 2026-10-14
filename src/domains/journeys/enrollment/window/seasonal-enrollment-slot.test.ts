import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalEnrollmentSlot } from "./seasonal-enrollment-slot.js";

test("SeasonalEnrollmentSlot starts in requested", () => {
  const item = newSeasonalEnrollmentSlot("code-855", "label-711");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalEnrollmentSlot moves to expired", () => {
  const item = newSeasonalEnrollmentSlot("code-855", "label-711");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("SeasonalEnrollmentSlot rejects moves from expired", () => {
  const item = newSeasonalEnrollmentSlot("code-855", "label-711");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
