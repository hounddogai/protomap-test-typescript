import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentAdjustment } from "./enrollment-adjustment.js";

test("EnrollmentAdjustment starts in new", () => {
  const item = newEnrollmentAdjustment("code-882", "title-617");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentAdjustment moves to running", () => {
  const item = newEnrollmentAdjustment("code-882", "title-617");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("EnrollmentAdjustment rejects moves from failed", () => {
  const item = newEnrollmentAdjustment("code-882", "title-617");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
