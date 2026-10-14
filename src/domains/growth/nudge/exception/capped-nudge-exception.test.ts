import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedNudgeException } from "./capped-nudge-exception.js";

test("CappedNudgeException starts in idle", () => {
  const item = newCappedNudgeException("code-99", "label-99");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedNudgeException moves to warming", () => {
  const item = newCappedNudgeException("code-99", "label-99");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CappedNudgeException rejects moves from stopped", () => {
  const item = newCappedNudgeException("code-99", "label-99");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
