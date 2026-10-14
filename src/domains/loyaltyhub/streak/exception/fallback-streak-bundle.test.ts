import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackStreakBundle } from "./fallback-streak-bundle.js";

test("FallbackStreakBundle starts in new", () => {
  const item = newFallbackStreakBundle("code-306", "title-762");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackStreakBundle moves to running", () => {
  const item = newFallbackStreakBundle("code-306", "title-762");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("FallbackStreakBundle rejects moves from failed", () => {
  const item = newFallbackStreakBundle("code-306", "title-762");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
