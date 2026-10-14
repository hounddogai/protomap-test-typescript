import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingLevelPolicy } from "./rolling-level-policy.js";

test("RollingLevelPolicy starts in planned", () => {
  const item = newRollingLevelPolicy("code-879", "name-292");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingLevelPolicy moves to in progress", () => {
  const item = newRollingLevelPolicy("code-879", "name-292");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RollingLevelPolicy rejects moves from cancelled", () => {
  const item = newRollingLevelPolicy("code-879", "name-292");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
