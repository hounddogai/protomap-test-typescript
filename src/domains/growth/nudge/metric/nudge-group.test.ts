import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeGroup } from "./nudge-group.js";

test("NudgeGroup starts in draft", () => {
  const item = newNudgeGroup("code-893", "title-558");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeGroup moves to pending", () => {
  const item = newNudgeGroup("code-893", "title-558");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("NudgeGroup rejects moves from closed", () => {
  const item = newNudgeGroup("code-893", "title-558");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
