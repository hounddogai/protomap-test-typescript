import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentEntry } from "./enrollment-entry.js";

test("EnrollmentEntry starts in idle", () => {
  const item = newEnrollmentEntry("code-608", "name-459");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentEntry moves to warming", () => {
  const item = newEnrollmentEntry("code-608", "name-459");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("EnrollmentEntry rejects moves from stopped", () => {
  const item = newEnrollmentEntry("code-608", "name-459");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
