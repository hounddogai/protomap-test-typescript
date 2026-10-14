import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientEnrollmentSlot } from "./lenient-enrollment-slot.js";

test("LenientEnrollmentSlot starts in idle", () => {
  const item = newLenientEnrollmentSlot("code-956", "name-823");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientEnrollmentSlot moves to warming", () => {
  const item = newLenientEnrollmentSlot("code-956", "name-823");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LenientEnrollmentSlot rejects moves from stopped", () => {
  const item = newLenientEnrollmentSlot("code-956", "name-823");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
