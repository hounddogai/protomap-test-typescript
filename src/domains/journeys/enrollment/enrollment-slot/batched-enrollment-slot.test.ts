import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedEnrollmentSlot } from "./batched-enrollment-slot.js";

test("BatchedEnrollmentSlot starts in idle", () => {
  const item = newBatchedEnrollmentSlot("code-825", "label-610");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedEnrollmentSlot moves to ready", () => {
  const item = newBatchedEnrollmentSlot("code-825", "label-610");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("BatchedEnrollmentSlot rejects moves from stopped", () => {
  const item = newBatchedEnrollmentSlot("code-825", "label-610");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
