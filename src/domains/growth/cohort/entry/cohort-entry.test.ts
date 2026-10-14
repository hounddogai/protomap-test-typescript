import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortEntry } from "./cohort-entry.js";

test("CohortEntry starts in open", () => {
  const item = newCohortEntry("code-298", "label-676");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortEntry moves to in review", () => {
  const item = newCohortEntry("code-298", "label-676");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("CohortEntry rejects moves from archived", () => {
  const item = newCohortEntry("code-298", "label-676");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
