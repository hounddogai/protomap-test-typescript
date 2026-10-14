import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentCycle } from "./enrollment-cycle.js";

test("EnrollmentCycle starts in planned", () => {
  const item = newEnrollmentCycle("code-815", "name-667");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentCycle moves to scheduled", () => {
  const item = newEnrollmentCycle("code-815", "name-667");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("EnrollmentCycle rejects moves from cancelled", () => {
  const item = newEnrollmentCycle("code-815", "name-667");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
