import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalEnrollmentSnapshot } from "./regional-enrollment-snapshot.js";

test("RegionalEnrollmentSnapshot starts in draft", () => {
  const item = newRegionalEnrollmentSnapshot("code-384", "title-321");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalEnrollmentSnapshot moves to active", () => {
  const item = newRegionalEnrollmentSnapshot("code-384", "title-321");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RegionalEnrollmentSnapshot rejects moves from closed", () => {
  const item = newRegionalEnrollmentSnapshot("code-384", "title-321");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
