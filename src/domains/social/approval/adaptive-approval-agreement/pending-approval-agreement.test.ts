import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingApprovalAgreement } from "./pending-approval-agreement.js";

test("PendingApprovalAgreement starts in proposed", () => {
  const item = newPendingApprovalAgreement("code-915", "label-938");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingApprovalAgreement moves to rejected", () => {
  const item = newPendingApprovalAgreement("code-915", "label-938");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PendingApprovalAgreement rejects moves from withdrawn", () => {
  const item = newPendingApprovalAgreement("code-915", "label-938");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
