import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictEnrollmentSummary } from "./strict-enrollment-summary.js";

test("StrictEnrollmentSummary starts in draft", () => {
  const item = newStrictEnrollmentSummary("code-506", "title-181");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictEnrollmentSummary moves to pending", () => {
  const item = newStrictEnrollmentSummary("code-506", "title-181");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("StrictEnrollmentSummary rejects moves from closed", () => {
  const item = newStrictEnrollmentSummary("code-506", "title-181");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
