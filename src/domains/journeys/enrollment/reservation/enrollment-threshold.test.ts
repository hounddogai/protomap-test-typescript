import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentThreshold } from "./enrollment-threshold.js";

test("EnrollmentThreshold starts in requested", () => {
  const item = newEnrollmentThreshold("code-527", "name-56");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentThreshold moves to granted", () => {
  const item = newEnrollmentThreshold("code-527", "name-56");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("EnrollmentThreshold rejects moves from expired", () => {
  const item = newEnrollmentThreshold("code-527", "name-56");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
