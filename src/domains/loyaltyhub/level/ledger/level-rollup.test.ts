import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelRollup } from "./level-rollup.js";

test("LevelRollup starts in created", () => {
  const item = newLevelRollup("code-623", "label-639");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelRollup moves to validated", () => {
  const item = newLevelRollup("code-623", "label-639");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LevelRollup rejects moves from retired", () => {
  const item = newLevelRollup("code-623", "label-639");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
