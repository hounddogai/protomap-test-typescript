import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakThreshold } from "./streak-threshold.js";

test("StreakThreshold starts in created", () => {
  const item = newStreakThreshold("code-450", "name-846");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakThreshold moves to published", () => {
  const item = newStreakThreshold("code-450", "name-846");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("StreakThreshold rejects moves from retired", () => {
  const item = newStreakThreshold("code-450", "name-846");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
