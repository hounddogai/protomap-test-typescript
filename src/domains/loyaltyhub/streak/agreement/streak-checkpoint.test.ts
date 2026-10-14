import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakCheckpoint } from "./streak-checkpoint.js";

test("StreakCheckpoint starts in open", () => {
  const item = newStreakCheckpoint("code-282", "title-733");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakCheckpoint moves to resolved", () => {
  const item = newStreakCheckpoint("code-282", "title-733");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("StreakCheckpoint rejects moves from archived", () => {
  const item = newStreakCheckpoint("code-282", "title-733");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
