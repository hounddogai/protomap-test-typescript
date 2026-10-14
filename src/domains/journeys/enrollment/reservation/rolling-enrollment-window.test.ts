import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingEnrollmentWindow } from "./rolling-enrollment-window.js";

test("RollingEnrollmentWindow starts in planned", () => {
  const item = newRollingEnrollmentWindow("code-508", "title-549");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingEnrollmentWindow moves to scheduled", () => {
  const item = newRollingEnrollmentWindow("code-508", "title-549");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RollingEnrollmentWindow rejects moves from cancelled", () => {
  const item = newRollingEnrollmentWindow("code-508", "title-549");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
