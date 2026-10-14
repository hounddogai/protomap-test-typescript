import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentRecord } from "./enrollment-record.js";

test("EnrollmentRecord starts in planned", () => {
  const item = newEnrollmentRecord("code-866", "title-761");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentRecord moves to completed", () => {
  const item = newEnrollmentRecord("code-866", "title-761");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("EnrollmentRecord rejects moves from cancelled", () => {
  const item = newEnrollmentRecord("code-866", "title-761");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
