import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeMilestone } from "./badge-milestone.js";

test("BadgeMilestone starts in new", () => {
  const item = newBadgeMilestone("code-274", "name-231");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeMilestone moves to failed", () => {
  const item = newBadgeMilestone("code-274", "name-231");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("BadgeMilestone rejects moves from failed", () => {
  const item = newBadgeMilestone("code-274", "name-231");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
