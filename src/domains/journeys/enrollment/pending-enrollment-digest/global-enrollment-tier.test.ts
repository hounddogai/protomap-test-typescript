import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalEnrollmentTier } from "./global-enrollment-tier.js";

test("GlobalEnrollmentTier starts in planned", () => {
  const item = newGlobalEnrollmentTier("code-219", "name-223");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalEnrollmentTier moves to in progress", () => {
  const item = newGlobalEnrollmentTier("code-219", "name-223");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("GlobalEnrollmentTier rejects moves from cancelled", () => {
  const item = newGlobalEnrollmentTier("code-219", "name-223");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
