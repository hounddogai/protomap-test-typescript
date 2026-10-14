import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeException } from "./nudge-exception.js";

test("NudgeException starts in draft", () => {
  const item = newNudgeException("code-839", "label-861");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeException moves to suspended", () => {
  const item = newNudgeException("code-839", "label-861");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("NudgeException rejects moves from closed", () => {
  const item = newNudgeException("code-839", "label-861");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
