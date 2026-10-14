import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualComplaintAgreement } from "./manual-complaint-agreement.js";

test("ManualComplaintAgreement starts in created", () => {
  const item = newManualComplaintAgreement("code-148", "title-704");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualComplaintAgreement moves to validated", () => {
  const item = newManualComplaintAgreement("code-148", "title-704");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ManualComplaintAgreement rejects moves from retired", () => {
  const item = newManualComplaintAgreement("code-148", "title-704");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
