import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledStreakQuota } from "./scheduled-streak-quota.js";

test("ScheduledStreakQuota starts in draft", () => {
  const item = newScheduledStreakQuota("code-785", "title-351");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledStreakQuota moves to pending", () => {
  const item = newScheduledStreakQuota("code-785", "title-351");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ScheduledStreakQuota rejects moves from closed", () => {
  const item = newScheduledStreakQuota("code-785", "title-351");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
