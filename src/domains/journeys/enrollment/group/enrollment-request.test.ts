import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentRequest } from "./enrollment-request.js";

test("EnrollmentRequest starts in requested", () => {
  const item = newEnrollmentRequest("code-826", "name-899");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentRequest moves to revoked", () => {
  const item = newEnrollmentRequest("code-826", "name-899");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("EnrollmentRequest rejects moves from expired", () => {
  const item = newEnrollmentRequest("code-826", "name-899");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
