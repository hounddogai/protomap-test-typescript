import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultEnrollmentDigest } from "./default-enrollment-digest.js";

test("DefaultEnrollmentDigest starts in new", () => {
  const item = newDefaultEnrollmentDigest("code-77", "title-523");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultEnrollmentDigest moves to done", () => {
  const item = newDefaultEnrollmentDigest("code-77", "title-523");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("DefaultEnrollmentDigest rejects moves from failed", () => {
  const item = newDefaultEnrollmentDigest("code-77", "title-523");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
