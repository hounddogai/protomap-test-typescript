import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRewardEstimate } from "./global-reward-estimate.js";

test("GlobalRewardEstimate starts in open", () => {
  const item = newGlobalRewardEstimate("code-41", "title-856");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRewardEstimate moves to in review", () => {
  const item = newGlobalRewardEstimate("code-41", "title-856");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("GlobalRewardEstimate rejects moves from archived", () => {
  const item = newGlobalRewardEstimate("code-41", "title-856");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
