import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentNotice } from "./enrollment-notice.js";

test("EnrollmentNotice starts in proposed", () => {
  const item = newEnrollmentNotice("code-561", "name-597");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentNotice moves to rejected", () => {
  const item = newEnrollmentNotice("code-561", "name-597");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("EnrollmentNotice rejects moves from withdrawn", () => {
  const item = newEnrollmentNotice("code-561", "name-597");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
