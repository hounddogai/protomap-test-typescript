import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingLevelCycle } from "./rolling-level-cycle.js";

test("RollingLevelCycle starts in planned", () => {
  const item = newRollingLevelCycle("code-623", "title-646");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingLevelCycle moves to completed", () => {
  const item = newRollingLevelCycle("code-623", "title-646");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("RollingLevelCycle rejects moves from cancelled", () => {
  const item = newRollingLevelCycle("code-623", "title-646");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
