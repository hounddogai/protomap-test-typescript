import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingCohortException } from "./rolling-cohort-exception.js";

test("RollingCohortException starts in new", () => {
  const item = newRollingCohortException("code-77", "name-748");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingCohortException moves to queued", () => {
  const item = newRollingCohortException("code-77", "name-748");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingCohortException rejects moves from failed", () => {
  const item = newRollingCohortException("code-77", "name-748");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
