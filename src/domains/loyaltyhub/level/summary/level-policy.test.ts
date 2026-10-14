import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelPolicy } from "./level-policy.js";

test("LevelPolicy starts in idle", () => {
  const item = newLevelPolicy("code-52", "name-776");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelPolicy moves to ready", () => {
  const item = newLevelPolicy("code-52", "name-776");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LevelPolicy rejects moves from stopped", () => {
  const item = newLevelPolicy("code-52", "name-776");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
