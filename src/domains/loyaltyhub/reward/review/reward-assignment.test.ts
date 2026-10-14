import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardAssignment } from "./reward-assignment.js";

test("RewardAssignment starts in proposed", () => {
  const item = newRewardAssignment("code-296", "label-388");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardAssignment moves to rejected", () => {
  const item = newRewardAssignment("code-296", "label-388");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RewardAssignment rejects moves from withdrawn", () => {
  const item = newRewardAssignment("code-296", "label-388");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
