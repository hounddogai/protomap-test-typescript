import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientEnrollmentDigest } from "./lenient-enrollment-digest.js";

test("LenientEnrollmentDigest starts in proposed", () => {
  const item = newLenientEnrollmentDigest("code-474", "label-259");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientEnrollmentDigest moves to approved", () => {
  const item = newLenientEnrollmentDigest("code-474", "label-259");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientEnrollmentDigest rejects moves from withdrawn", () => {
  const item = newLenientEnrollmentDigest("code-474", "label-259");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
