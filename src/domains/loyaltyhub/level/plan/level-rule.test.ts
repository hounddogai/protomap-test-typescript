import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelRule } from "./level-rule.js";

test("LevelRule starts in idle", () => {
  const item = newLevelRule("code-806", "label-546");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelRule moves to ready", () => {
  const item = newLevelRule("code-806", "label-546");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LevelRule rejects moves from stopped", () => {
  const item = newLevelRule("code-806", "label-546");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
