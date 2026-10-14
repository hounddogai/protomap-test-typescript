import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingLevelAllocation } from "./rolling-level-allocation.js";

test("RollingLevelAllocation starts in proposed", () => {
  const item = newRollingLevelAllocation("code-121", "title-159");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingLevelAllocation moves to withdrawn", () => {
  const item = newRollingLevelAllocation("code-121", "title-159");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RollingLevelAllocation rejects moves from withdrawn", () => {
  const item = newRollingLevelAllocation("code-121", "title-159");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
