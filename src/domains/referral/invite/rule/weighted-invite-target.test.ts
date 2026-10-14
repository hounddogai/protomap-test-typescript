import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedInviteTarget } from "./weighted-invite-target.js";

test("WeightedInviteTarget starts in planned", () => {
  const item = newWeightedInviteTarget("code-13", "title-734");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedInviteTarget moves to scheduled", () => {
  const item = newWeightedInviteTarget("code-13", "title-734");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WeightedInviteTarget rejects moves from cancelled", () => {
  const item = newWeightedInviteTarget("code-13", "title-734");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
