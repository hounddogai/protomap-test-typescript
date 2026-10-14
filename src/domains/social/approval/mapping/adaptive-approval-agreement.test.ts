import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveApprovalAgreement } from "./adaptive-approval-agreement.js";

test("AdaptiveApprovalAgreement starts in proposed", () => {
  const item = newAdaptiveApprovalAgreement("code-508", "label-683");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveApprovalAgreement moves to approved", () => {
  const item = newAdaptiveApprovalAgreement("code-508", "label-683");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("AdaptiveApprovalAgreement rejects moves from withdrawn", () => {
  const item = newAdaptiveApprovalAgreement("code-508", "label-683");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
