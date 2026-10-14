import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakQuota } from "./streak-quota.js";

test("StreakQuota starts in open", () => {
  const item = newStreakQuota("code-673", "label-768");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakQuota moves to in review", () => {
  const item = newStreakQuota("code-673", "label-768");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("StreakQuota rejects moves from archived", () => {
  const item = newStreakQuota("code-673", "label-768");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
