import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalApprovalSlot } from "./regional-approval-slot.js";

test("RegionalApprovalSlot starts in proposed", () => {
  const item = newRegionalApprovalSlot("code-791", "label-915");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalApprovalSlot moves to withdrawn", () => {
  const item = newRegionalApprovalSlot("code-791", "label-915");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RegionalApprovalSlot rejects moves from withdrawn", () => {
  const item = newRegionalApprovalSlot("code-791", "label-915");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
