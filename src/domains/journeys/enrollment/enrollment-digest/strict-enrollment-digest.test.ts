import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictEnrollmentDigest } from "./strict-enrollment-digest.js";

test("StrictEnrollmentDigest starts in new", () => {
  const item = newStrictEnrollmentDigest("code-11", "title-615");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictEnrollmentDigest moves to done", () => {
  const item = newStrictEnrollmentDigest("code-11", "title-615");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("StrictEnrollmentDigest rejects moves from failed", () => {
  const item = newStrictEnrollmentDigest("code-11", "title-615");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
