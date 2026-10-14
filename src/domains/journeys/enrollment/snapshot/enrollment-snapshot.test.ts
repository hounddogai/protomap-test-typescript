import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentSnapshot } from "./enrollment-snapshot.js";

test("EnrollmentSnapshot starts in new", () => {
  const item = newEnrollmentSnapshot("code-105", "title-896");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentSnapshot moves to queued", () => {
  const item = newEnrollmentSnapshot("code-105", "title-896");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("EnrollmentSnapshot rejects moves from failed", () => {
  const item = newEnrollmentSnapshot("code-105", "title-896");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
