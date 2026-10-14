import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentSlot } from "./enrollment-slot.js";

test("EnrollmentSlot starts in new", () => {
  const item = newEnrollmentSlot("code-565", "title-316");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentSlot moves to queued", () => {
  const item = newEnrollmentSlot("code-565", "title-316");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("EnrollmentSlot rejects moves from failed", () => {
  const item = newEnrollmentSlot("code-565", "title-316");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
