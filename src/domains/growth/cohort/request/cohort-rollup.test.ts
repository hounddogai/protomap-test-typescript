import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortRollup } from "./cohort-rollup.js";

test("CohortRollup starts in open", () => {
  const item = newCohortRollup("code-760", "title-281");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortRollup moves to reopened", () => {
  const item = newCohortRollup("code-760", "title-281");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("CohortRollup rejects moves from archived", () => {
  const item = newCohortRollup("code-760", "title-281");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
