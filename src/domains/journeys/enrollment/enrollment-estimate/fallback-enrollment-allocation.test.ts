import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackEnrollmentAllocation } from "./fallback-enrollment-allocation.js";

test("FallbackEnrollmentAllocation starts in idle", () => {
  const item = newFallbackEnrollmentAllocation("code-486", "label-636");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackEnrollmentAllocation moves to stopped", () => {
  const item = newFallbackEnrollmentAllocation("code-486", "label-636");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("FallbackEnrollmentAllocation rejects moves from stopped", () => {
  const item = newFallbackEnrollmentAllocation("code-486", "label-636");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
