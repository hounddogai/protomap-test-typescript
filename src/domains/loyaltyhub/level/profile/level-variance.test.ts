import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelVariance } from "./level-variance.js";

test("LevelVariance starts in open", () => {
  const item = newLevelVariance("code-997", "title-409");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelVariance moves to in review", () => {
  const item = newLevelVariance("code-997", "title-409");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LevelVariance rejects moves from archived", () => {
  const item = newLevelVariance("code-997", "title-409");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
