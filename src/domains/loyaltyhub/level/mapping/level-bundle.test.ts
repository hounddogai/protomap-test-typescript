import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelBundle } from "./level-bundle.js";

test("LevelBundle starts in draft", () => {
  const item = newLevelBundle("code-696", "title-927");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelBundle moves to pending", () => {
  const item = newLevelBundle("code-696", "title-927");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LevelBundle rejects moves from closed", () => {
  const item = newLevelBundle("code-696", "title-927");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
