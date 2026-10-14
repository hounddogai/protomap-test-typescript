import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakScore } from "./streak-score.js";

test("StreakScore starts in draft", () => {
  const item = newStreakScore("code-361", "title-110");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakScore moves to pending", () => {
  const item = newStreakScore("code-361", "title-110");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("StreakScore rejects moves from closed", () => {
  const item = newStreakScore("code-361", "title-110");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
