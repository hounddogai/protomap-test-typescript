import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingWaitMilestone } from "./pending-wait-milestone.js";

test("PendingWaitMilestone starts in open", () => {
  const item = newPendingWaitMilestone("code-774", "title-818");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingWaitMilestone moves to in review", () => {
  const item = newPendingWaitMilestone("code-774", "title-818");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PendingWaitMilestone rejects moves from archived", () => {
  const item = newPendingWaitMilestone("code-774", "title-818");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
