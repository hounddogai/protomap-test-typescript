import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedInviteProfile } from "./weighted-invite-profile.js";

test("WeightedInviteProfile starts in created", () => {
  const item = newWeightedInviteProfile("code-682", "label-23");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedInviteProfile moves to published", () => {
  const item = newWeightedInviteProfile("code-682", "label-23");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WeightedInviteProfile rejects moves from retired", () => {
  const item = newWeightedInviteProfile("code-682", "label-23");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
