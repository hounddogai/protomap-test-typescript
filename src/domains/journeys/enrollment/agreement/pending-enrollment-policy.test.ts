import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingEnrollmentPolicy } from "./pending-enrollment-policy.js";

test("PendingEnrollmentPolicy starts in open", () => {
  const item = newPendingEnrollmentPolicy("code-682", "title-475");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingEnrollmentPolicy moves to in review", () => {
  const item = newPendingEnrollmentPolicy("code-682", "title-475");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PendingEnrollmentPolicy rejects moves from archived", () => {
  const item = newPendingEnrollmentPolicy("code-682", "title-475");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
