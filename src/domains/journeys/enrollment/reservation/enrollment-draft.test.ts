import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentDraft } from "./enrollment-draft.js";

test("EnrollmentDraft starts in planned", () => {
  const item = newEnrollmentDraft("code-519", "label-842");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentDraft moves to in progress", () => {
  const item = newEnrollmentDraft("code-519", "label-842");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("EnrollmentDraft rejects moves from cancelled", () => {
  const item = newEnrollmentDraft("code-519", "label-842");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
