import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPostScore } from "./rolling-post-score.js";

test("RollingPostScore starts in open", () => {
  const item = newRollingPostScore("code-155", "title-748");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPostScore moves to resolved", () => {
  const item = newRollingPostScore("code-155", "title-748");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RollingPostScore rejects moves from archived", () => {
  const item = newRollingPostScore("code-155", "title-748");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
