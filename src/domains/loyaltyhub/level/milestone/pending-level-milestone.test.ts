import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingLevelMilestone } from "./pending-level-milestone.js";

test("PendingLevelMilestone starts in draft", () => {
  const item = newPendingLevelMilestone("code-82", "label-7");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingLevelMilestone moves to suspended", () => {
  const item = newPendingLevelMilestone("code-82", "label-7");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PendingLevelMilestone rejects moves from closed", () => {
  const item = newPendingLevelMilestone("code-82", "label-7");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
