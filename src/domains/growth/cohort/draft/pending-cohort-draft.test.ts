import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCohortDraft } from "./pending-cohort-draft.js";

test("PendingCohortDraft starts in open", () => {
  const item = newPendingCohortDraft("code-937", "label-310");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCohortDraft moves to reopened", () => {
  const item = newPendingCohortDraft("code-937", "label-310");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PendingCohortDraft rejects moves from archived", () => {
  const item = newPendingCohortDraft("code-937", "label-310");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
