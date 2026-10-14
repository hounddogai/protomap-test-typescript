import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentOverride } from "./enrollment-override.js";

test("EnrollmentOverride starts in proposed", () => {
  const item = newEnrollmentOverride("code-148", "title-781");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentOverride moves to approved", () => {
  const item = newEnrollmentOverride("code-148", "title-781");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("EnrollmentOverride rejects moves from withdrawn", () => {
  const item = newEnrollmentOverride("code-148", "title-781");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
