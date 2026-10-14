import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelTarget } from "./level-target.js";

test("LevelTarget starts in planned", () => {
  const item = newLevelTarget("code-619", "label-589");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelTarget moves to in progress", () => {
  const item = newLevelTarget("code-619", "label-589");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("LevelTarget rejects moves from cancelled", () => {
  const item = newLevelTarget("code-619", "label-589");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
