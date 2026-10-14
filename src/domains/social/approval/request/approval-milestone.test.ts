import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalMilestone } from "./approval-milestone.js";

test("ApprovalMilestone starts in open", () => {
  const item = newApprovalMilestone("code-904", "label-490");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalMilestone moves to resolved", () => {
  const item = newApprovalMilestone("code-904", "label-490");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ApprovalMilestone rejects moves from archived", () => {
  const item = newApprovalMilestone("code-904", "label-490");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
