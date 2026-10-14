import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalSummary } from "./approval-summary.js";

test("ApprovalSummary starts in open", () => {
  const item = newApprovalSummary("code-621", "title-345");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalSummary moves to in review", () => {
  const item = newApprovalSummary("code-621", "title-345");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ApprovalSummary rejects moves from archived", () => {
  const item = newApprovalSummary("code-621", "title-345");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
