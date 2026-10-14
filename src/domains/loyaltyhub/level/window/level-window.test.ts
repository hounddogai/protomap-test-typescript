import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelWindow } from "./level-window.js";

test("LevelWindow starts in created", () => {
  const item = newLevelWindow("code-675", "name-400");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelWindow moves to validated", () => {
  const item = newLevelWindow("code-675", "name-400");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LevelWindow rejects moves from retired", () => {
  const item = newLevelWindow("code-675", "name-400");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
