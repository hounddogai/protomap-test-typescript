import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionAgreement } from "./retention-agreement.js";

test("RetentionAgreement starts in planned", () => {
  const item = newRetentionAgreement("code-281", "label-678");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionAgreement moves to cancelled", () => {
  const item = newRetentionAgreement("code-281", "label-678");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("RetentionAgreement rejects moves from cancelled", () => {
  const item = newRetentionAgreement("code-281", "label-678");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
