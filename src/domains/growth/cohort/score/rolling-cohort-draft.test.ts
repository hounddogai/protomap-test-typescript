import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingCohortDraft } from "./rolling-cohort-draft.js";

test("RollingCohortDraft starts in idle", () => {
  const item = newRollingCohortDraft("code-607", "name-825");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingCohortDraft moves to warming", () => {
  const item = newRollingCohortDraft("code-607", "name-825");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RollingCohortDraft rejects moves from stopped", () => {
  const item = newRollingCohortDraft("code-607", "name-825");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
