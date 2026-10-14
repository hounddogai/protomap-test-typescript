import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedEnrollmentRequest } from "./capped-enrollment-request.js";

test("CappedEnrollmentRequest starts in idle", () => {
  const item = newCappedEnrollmentRequest("code-572", "title-498");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedEnrollmentRequest moves to draining", () => {
  const item = newCappedEnrollmentRequest("code-572", "title-498");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("CappedEnrollmentRequest rejects moves from stopped", () => {
  const item = newCappedEnrollmentRequest("code-572", "title-498");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
