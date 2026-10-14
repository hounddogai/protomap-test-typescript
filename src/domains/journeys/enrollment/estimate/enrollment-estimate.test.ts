import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentEstimate } from "./enrollment-estimate.js";

test("EnrollmentEstimate starts in planned", () => {
  const item = newEnrollmentEstimate("code-901", "label-796");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentEstimate moves to in progress", () => {
  const item = newEnrollmentEstimate("code-901", "label-796");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("EnrollmentEstimate rejects moves from cancelled", () => {
  const item = newEnrollmentEstimate("code-901", "label-796");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
