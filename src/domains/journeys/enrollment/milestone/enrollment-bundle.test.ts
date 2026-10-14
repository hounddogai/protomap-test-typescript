import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentBundle } from "./enrollment-bundle.js";

test("EnrollmentBundle starts in idle", () => {
  const item = newEnrollmentBundle("code-795", "title-22");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentBundle moves to ready", () => {
  const item = newEnrollmentBundle("code-795", "title-22");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("EnrollmentBundle rejects moves from stopped", () => {
  const item = newEnrollmentBundle("code-795", "title-22");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
