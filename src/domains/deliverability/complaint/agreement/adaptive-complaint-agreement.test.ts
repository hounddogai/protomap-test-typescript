import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveComplaintAgreement } from "./adaptive-complaint-agreement.js";

test("AdaptiveComplaintAgreement starts in requested", () => {
  const item = newAdaptiveComplaintAgreement("code-679", "label-724");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveComplaintAgreement moves to expired", () => {
  const item = newAdaptiveComplaintAgreement("code-679", "label-724");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("AdaptiveComplaintAgreement rejects moves from expired", () => {
  const item = newAdaptiveComplaintAgreement("code-679", "label-724");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
