import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortDraft } from "./cohort-draft.js";

test("CohortDraft starts in idle", () => {
  const item = newCohortDraft("code-348", "title-200");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortDraft moves to ready", () => {
  const item = newCohortDraft("code-348", "title-200");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("CohortDraft rejects moves from stopped", () => {
  const item = newCohortDraft("code-348", "title-200");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
