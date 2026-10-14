import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingApprovalEstimate } from "./rolling-approval-estimate.js";

test("RollingApprovalEstimate starts in open", () => {
  const item = newRollingApprovalEstimate("code-780", "name-161");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingApprovalEstimate moves to in review", () => {
  const item = newRollingApprovalEstimate("code-780", "name-161");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RollingApprovalEstimate rejects moves from archived", () => {
  const item = newRollingApprovalEstimate("code-780", "name-161");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
