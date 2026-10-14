import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentManifest } from "./enrollment-manifest.js";

test("EnrollmentManifest starts in created", () => {
  const item = newEnrollmentManifest("code-844", "name-5");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentManifest moves to published", () => {
  const item = newEnrollmentManifest("code-844", "name-5");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("EnrollmentManifest rejects moves from retired", () => {
  const item = newEnrollmentManifest("code-844", "name-5");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
