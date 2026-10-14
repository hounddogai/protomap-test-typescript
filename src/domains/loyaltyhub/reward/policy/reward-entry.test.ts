import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardEntry } from "./reward-entry.js";

test("RewardEntry starts in open", () => {
  const item = newRewardEntry("code-136", "name-138");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardEntry moves to in review", () => {
  const item = newRewardEntry("code-136", "name-138");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RewardEntry rejects moves from archived", () => {
  const item = newRewardEntry("code-136", "name-138");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
