import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryRewardException } from "./primary-reward-exception.js";

test("PrimaryRewardException starts in new", () => {
  const item = newPrimaryRewardException("code-863", "title-612");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryRewardException moves to done", () => {
  const item = newPrimaryRewardException("code-863", "title-612");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PrimaryRewardException rejects moves from failed", () => {
  const item = newPrimaryRewardException("code-863", "title-612");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
