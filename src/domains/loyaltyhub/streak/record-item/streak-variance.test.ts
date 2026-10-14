import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakVariance } from "./streak-variance.js";

test("StreakVariance starts in new", () => {
  const item = newStreakVariance("code-284", "label-721");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakVariance moves to done", () => {
  const item = newStreakVariance("code-284", "label-721");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("StreakVariance rejects moves from failed", () => {
  const item = newStreakVariance("code-284", "label-721");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
