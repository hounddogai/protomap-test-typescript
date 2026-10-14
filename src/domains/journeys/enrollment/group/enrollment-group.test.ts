import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentGroup } from "./enrollment-group.js";

test("EnrollmentGroup starts in draft", () => {
  const item = newEnrollmentGroup("code-210", "name-108");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentGroup moves to pending", () => {
  const item = newEnrollmentGroup("code-210", "name-108");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("EnrollmentGroup rejects moves from closed", () => {
  const item = newEnrollmentGroup("code-210", "name-108");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
