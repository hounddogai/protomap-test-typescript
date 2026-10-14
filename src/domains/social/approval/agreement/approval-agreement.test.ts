import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalAgreement } from "./approval-agreement.js";

test("ApprovalAgreement starts in planned", () => {
  const item = newApprovalAgreement("code-551", "name-347");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalAgreement moves to scheduled", () => {
  const item = newApprovalAgreement("code-551", "name-347");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ApprovalAgreement rejects moves from cancelled", () => {
  const item = newApprovalAgreement("code-551", "name-347");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
