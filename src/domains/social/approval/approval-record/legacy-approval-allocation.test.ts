import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyApprovalAllocation } from "./legacy-approval-allocation.js";

test("LegacyApprovalAllocation starts in open", () => {
  const item = newLegacyApprovalAllocation("code-278", "label-772");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyApprovalAllocation moves to resolved", () => {
  const item = newLegacyApprovalAllocation("code-278", "label-772");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("LegacyApprovalAllocation rejects moves from archived", () => {
  const item = newLegacyApprovalAllocation("code-278", "label-772");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
