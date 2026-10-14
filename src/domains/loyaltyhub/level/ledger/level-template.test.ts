import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelTemplate } from "./level-template.js";

test("LevelTemplate starts in open", () => {
  const item = newLevelTemplate("code-120", "name-102");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelTemplate moves to archived", () => {
  const item = newLevelTemplate("code-120", "name-102");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("LevelTemplate rejects moves from archived", () => {
  const item = newLevelTemplate("code-120", "name-102");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
