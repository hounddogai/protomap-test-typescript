import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedInviteTier } from "./weighted-invite-tier.js";

test("WeightedInviteTier starts in draft", () => {
  const item = newWeightedInviteTier("code-19", "name-27");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedInviteTier moves to suspended", () => {
  const item = newWeightedInviteTier("code-19", "name-27");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("WeightedInviteTier rejects moves from closed", () => {
  const item = newWeightedInviteTier("code-19", "name-27");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
