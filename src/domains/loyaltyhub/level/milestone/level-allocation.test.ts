import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelAllocation } from "./level-allocation.js";

test("LevelAllocation starts in new", () => {
  const item = newLevelAllocation("code-786", "title-804");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelAllocation moves to running", () => {
  const item = newLevelAllocation("code-786", "title-804");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LevelAllocation rejects moves from failed", () => {
  const item = newLevelAllocation("code-786", "title-804");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
