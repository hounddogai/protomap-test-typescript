import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalApprovalAgreement } from "./regional-approval-agreement.js";

test("RegionalApprovalAgreement starts in proposed", () => {
  const item = newRegionalApprovalAgreement("code-901", "label-930");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalApprovalAgreement moves to rejected", () => {
  const item = newRegionalApprovalAgreement("code-901", "label-930");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RegionalApprovalAgreement rejects moves from withdrawn", () => {
  const item = newRegionalApprovalAgreement("code-901", "label-930");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
