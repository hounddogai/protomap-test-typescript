import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentPreference } from "./enrollment-preference.js";

test("EnrollmentPreference starts in idle", () => {
  const item = newEnrollmentPreference("code-215", "title-521");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentPreference moves to warming", () => {
  const item = newEnrollmentPreference("code-215", "title-521");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("EnrollmentPreference rejects moves from stopped", () => {
  const item = newEnrollmentPreference("code-215", "title-521");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
