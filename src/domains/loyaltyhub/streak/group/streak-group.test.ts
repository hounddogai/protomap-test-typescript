import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakGroup } from "./streak-group.js";

test("StreakGroup starts in new", () => {
  const item = newStreakGroup("code-694", "title-45");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakGroup moves to running", () => {
  const item = newStreakGroup("code-694", "title-45");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("StreakGroup rejects moves from failed", () => {
  const item = newStreakGroup("code-694", "title-45");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
