import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentVariance } from "./enrollment-variance.js";

test("EnrollmentVariance starts in requested", () => {
  const item = newEnrollmentVariance("code-137", "name-128");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentVariance moves to expired", () => {
  const item = newEnrollmentVariance("code-137", "name-128");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("EnrollmentVariance rejects moves from expired", () => {
  const item = newEnrollmentVariance("code-137", "name-128");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
