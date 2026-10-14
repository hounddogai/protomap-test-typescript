import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictEnrollmentAdjustment } from "./strict-enrollment-adjustment.js";

test("StrictEnrollmentAdjustment starts in proposed", () => {
  const item = newStrictEnrollmentAdjustment("code-817", "name-223");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictEnrollmentAdjustment moves to approved", () => {
  const item = newStrictEnrollmentAdjustment("code-817", "name-223");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("StrictEnrollmentAdjustment rejects moves from withdrawn", () => {
  const item = newStrictEnrollmentAdjustment("code-817", "name-223");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
