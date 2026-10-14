import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentAllocation } from "./enrollment-allocation.js";

test("EnrollmentAllocation starts in planned", () => {
  const item = newEnrollmentAllocation("code-958", "title-524");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentAllocation moves to scheduled", () => {
  const item = newEnrollmentAllocation("code-958", "title-524");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("EnrollmentAllocation rejects moves from cancelled", () => {
  const item = newEnrollmentAllocation("code-958", "title-524");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
