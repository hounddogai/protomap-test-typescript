import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryApprovalAgreement } from "./primary-approval-agreement.js";

test("PrimaryApprovalAgreement starts in proposed", () => {
  const item = newPrimaryApprovalAgreement("code-553", "name-932");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryApprovalAgreement moves to approved", () => {
  const item = newPrimaryApprovalAgreement("code-553", "name-932");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryApprovalAgreement rejects moves from withdrawn", () => {
  const item = newPrimaryApprovalAgreement("code-553", "name-932");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
