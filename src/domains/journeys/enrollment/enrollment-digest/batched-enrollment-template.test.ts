import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedEnrollmentTemplate } from "./batched-enrollment-template.js";

test("BatchedEnrollmentTemplate starts in requested", () => {
  const item = newBatchedEnrollmentTemplate("code-838", "label-213");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedEnrollmentTemplate moves to revoked", () => {
  const item = newBatchedEnrollmentTemplate("code-838", "label-213");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("BatchedEnrollmentTemplate rejects moves from expired", () => {
  const item = newBatchedEnrollmentTemplate("code-838", "label-213");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
