import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalTier } from "./approval-tier.js";

test("ApprovalTier starts in idle", () => {
  const item = newApprovalTier("code-509", "title-428");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalTier moves to draining", () => {
  const item = newApprovalTier("code-509", "title-428");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("ApprovalTier rejects moves from stopped", () => {
  const item = newApprovalTier("code-509", "title-428");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
