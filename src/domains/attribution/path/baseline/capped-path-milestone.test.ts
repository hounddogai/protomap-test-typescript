import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedPathMilestone } from "./capped-path-milestone.js";

test("CappedPathMilestone starts in draft", () => {
  const item = newCappedPathMilestone("code-119", "label-770");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedPathMilestone moves to pending", () => {
  const item = newCappedPathMilestone("code-119", "label-770");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CappedPathMilestone rejects moves from closed", () => {
  const item = newCappedPathMilestone("code-119", "label-770");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
