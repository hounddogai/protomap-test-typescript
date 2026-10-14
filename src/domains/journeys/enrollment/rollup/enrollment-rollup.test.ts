import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentRollup } from "./enrollment-rollup.js";

test("EnrollmentRollup starts in requested", () => {
  const item = newEnrollmentRollup("code-524", "title-998");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentRollup moves to expired", () => {
  const item = newEnrollmentRollup("code-524", "title-998");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("EnrollmentRollup rejects moves from expired", () => {
  const item = newEnrollmentRollup("code-524", "title-998");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
