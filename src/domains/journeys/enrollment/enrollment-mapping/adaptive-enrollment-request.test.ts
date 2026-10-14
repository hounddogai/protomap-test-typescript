import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveEnrollmentRequest } from "./adaptive-enrollment-request.js";

test("AdaptiveEnrollmentRequest starts in idle", () => {
  const item = newAdaptiveEnrollmentRequest("code-402", "name-373");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveEnrollmentRequest moves to warming", () => {
  const item = newAdaptiveEnrollmentRequest("code-402", "name-373");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("AdaptiveEnrollmentRequest rejects moves from stopped", () => {
  const item = newAdaptiveEnrollmentRequest("code-402", "name-373");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
