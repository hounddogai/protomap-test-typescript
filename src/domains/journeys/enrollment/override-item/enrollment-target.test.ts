import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentTarget } from "./enrollment-target.js";

test("EnrollmentTarget starts in draft", () => {
  const item = newEnrollmentTarget("code-287", "name-658");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentTarget moves to active", () => {
  const item = newEnrollmentTarget("code-287", "name-658");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("EnrollmentTarget rejects moves from closed", () => {
  const item = newEnrollmentTarget("code-287", "name-658");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
