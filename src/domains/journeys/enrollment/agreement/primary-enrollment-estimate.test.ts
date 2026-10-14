import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryEnrollmentEstimate } from "./primary-enrollment-estimate.js";

test("PrimaryEnrollmentEstimate starts in proposed", () => {
  const item = newPrimaryEnrollmentEstimate("code-228", "name-343");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryEnrollmentEstimate moves to approved", () => {
  const item = newPrimaryEnrollmentEstimate("code-228", "name-343");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryEnrollmentEstimate rejects moves from withdrawn", () => {
  const item = newPrimaryEnrollmentEstimate("code-228", "name-343");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
