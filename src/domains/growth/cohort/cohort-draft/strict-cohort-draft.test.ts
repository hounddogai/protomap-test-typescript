import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCohortDraft } from "./strict-cohort-draft.js";

test("StrictCohortDraft starts in planned", () => {
  const item = newStrictCohortDraft("code-765", "label-179");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCohortDraft moves to scheduled", () => {
  const item = newStrictCohortDraft("code-765", "label-179");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("StrictCohortDraft rejects moves from cancelled", () => {
  const item = newStrictCohortDraft("code-765", "label-179");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
