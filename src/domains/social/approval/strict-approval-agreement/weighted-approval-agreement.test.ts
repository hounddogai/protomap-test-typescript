import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedApprovalAgreement } from "./weighted-approval-agreement.js";

test("WeightedApprovalAgreement starts in new", () => {
  const item = newWeightedApprovalAgreement("code-444", "title-766");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedApprovalAgreement moves to queued", () => {
  const item = newWeightedApprovalAgreement("code-444", "title-766");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("WeightedApprovalAgreement rejects moves from failed", () => {
  const item = newWeightedApprovalAgreement("code-444", "title-766");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
