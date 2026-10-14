import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortBaseline } from "./cohort-baseline.js";

test("CohortBaseline starts in open", () => {
  const item = newCohortBaseline("code-472", "title-984");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortBaseline moves to reopened", () => {
  const item = newCohortBaseline("code-472", "title-984");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("CohortBaseline rejects moves from archived", () => {
  const item = newCohortBaseline("code-472", "title-984");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
