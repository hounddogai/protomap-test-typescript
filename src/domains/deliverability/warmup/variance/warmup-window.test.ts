import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupWindow } from "./warmup-window.js";

test("WarmupWindow starts in new", () => {
  const item = newWarmupWindow("code-310", "name-987");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupWindow moves to running", () => {
  const item = newWarmupWindow("code-310", "name-987");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("WarmupWindow rejects moves from failed", () => {
  const item = newWarmupWindow("code-310", "name-987");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
