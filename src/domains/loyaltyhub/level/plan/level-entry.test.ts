import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelEntry } from "./level-entry.js";

test("LevelEntry starts in open", () => {
  const item = newLevelEntry("code-726", "label-571");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelEntry moves to resolved", () => {
  const item = newLevelEntry("code-726", "label-571");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("LevelEntry rejects moves from archived", () => {
  const item = newLevelEntry("code-726", "label-571");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
