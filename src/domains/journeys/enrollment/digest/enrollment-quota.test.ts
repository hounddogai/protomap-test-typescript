import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentQuota } from "./enrollment-quota.js";

test("EnrollmentQuota starts in planned", () => {
  const item = newEnrollmentQuota("code-139", "label-828");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentQuota moves to completed", () => {
  const item = newEnrollmentQuota("code-139", "label-828");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("EnrollmentQuota rejects moves from cancelled", () => {
  const item = newEnrollmentQuota("code-139", "label-828");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
