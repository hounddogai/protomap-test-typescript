import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackStreakTarget } from "./fallback-streak-target.js";

test("FallbackStreakTarget starts in proposed", () => {
  const item = newFallbackStreakTarget("code-237", "name-269");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackStreakTarget moves to approved", () => {
  const item = newFallbackStreakTarget("code-237", "name-269");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FallbackStreakTarget rejects moves from withdrawn", () => {
  const item = newFallbackStreakTarget("code-237", "name-269");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
