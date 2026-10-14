import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentTemplate } from "./enrollment-template.js";

test("EnrollmentTemplate starts in planned", () => {
  const item = newEnrollmentTemplate("code-514", "name-610");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentTemplate moves to in progress", () => {
  const item = newEnrollmentTemplate("code-514", "name-610");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("EnrollmentTemplate rejects moves from cancelled", () => {
  const item = newEnrollmentTemplate("code-514", "name-610");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
