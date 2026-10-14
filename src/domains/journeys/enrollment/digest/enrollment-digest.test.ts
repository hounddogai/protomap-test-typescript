import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentDigest } from "./enrollment-digest.js";

test("EnrollmentDigest starts in proposed", () => {
  const item = newEnrollmentDigest("code-934", "label-571");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentDigest moves to approved", () => {
  const item = newEnrollmentDigest("code-934", "label-571");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("EnrollmentDigest rejects moves from withdrawn", () => {
  const item = newEnrollmentDigest("code-934", "label-571");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
