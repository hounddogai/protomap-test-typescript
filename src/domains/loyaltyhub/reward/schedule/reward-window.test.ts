import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardWindow } from "./reward-window.js";

test("RewardWindow starts in created", () => {
  const item = newRewardWindow("code-800", "title-209");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardWindow moves to published", () => {
  const item = newRewardWindow("code-800", "title-209");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RewardWindow rejects moves from retired", () => {
  const item = newRewardWindow("code-800", "title-209");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
