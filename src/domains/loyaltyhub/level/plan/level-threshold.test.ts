import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelThreshold } from "./level-threshold.js";

test("LevelThreshold starts in open", () => {
  const item = newLevelThreshold("code-50", "label-368");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelThreshold moves to archived", () => {
  const item = newLevelThreshold("code-50", "label-368");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("LevelThreshold rejects moves from archived", () => {
  const item = newLevelThreshold("code-50", "label-368");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
