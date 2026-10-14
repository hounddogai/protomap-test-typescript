import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveEnrollmentQuota } from "./adaptive-enrollment-quota.js";

test("AdaptiveEnrollmentQuota starts in proposed", () => {
  const item = newAdaptiveEnrollmentQuota("code-718", "name-333");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveEnrollmentQuota moves to approved", () => {
  const item = newAdaptiveEnrollmentQuota("code-718", "name-333");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("AdaptiveEnrollmentQuota rejects moves from withdrawn", () => {
  const item = newAdaptiveEnrollmentQuota("code-718", "name-333");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
