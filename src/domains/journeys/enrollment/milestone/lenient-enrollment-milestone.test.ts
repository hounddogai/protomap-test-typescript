import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientEnrollmentMilestone } from "./lenient-enrollment-milestone.js";

test("LenientEnrollmentMilestone starts in draft", () => {
  const item = newLenientEnrollmentMilestone("code-748", "label-869");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientEnrollmentMilestone moves to pending", () => {
  const item = newLenientEnrollmentMilestone("code-748", "label-869");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LenientEnrollmentMilestone rejects moves from closed", () => {
  const item = newLenientEnrollmentMilestone("code-748", "label-869");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
