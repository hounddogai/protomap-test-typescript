import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelSegment } from "./level-segment.js";

test("LevelSegment starts in open", () => {
  const item = newLevelSegment("code-54", "label-625");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelSegment moves to in review", () => {
  const item = newLevelSegment("code-54", "label-625");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LevelSegment rejects moves from archived", () => {
  const item = newLevelSegment("code-54", "label-625");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
