import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultLevelCycle } from "./default-level-cycle.js";

test("DefaultLevelCycle starts in planned", () => {
  const item = newDefaultLevelCycle("code-564", "name-630");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultLevelCycle moves to in progress", () => {
  const item = newDefaultLevelCycle("code-564", "name-630");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("DefaultLevelCycle rejects moves from cancelled", () => {
  const item = newDefaultLevelCycle("code-564", "name-630");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
