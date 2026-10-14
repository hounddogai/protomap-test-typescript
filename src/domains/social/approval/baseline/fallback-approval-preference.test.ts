import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackApprovalPreference } from "./fallback-approval-preference.js";

test("FallbackApprovalPreference starts in new", () => {
  const item = newFallbackApprovalPreference("code-797", "label-982");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackApprovalPreference moves to failed", () => {
  const item = newFallbackApprovalPreference("code-797", "label-982");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("FallbackApprovalPreference rejects moves from failed", () => {
  const item = newFallbackApprovalPreference("code-797", "label-982");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
