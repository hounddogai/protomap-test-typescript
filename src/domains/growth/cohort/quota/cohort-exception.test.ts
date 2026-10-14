import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortException } from "./cohort-exception.js";

test("CohortException starts in draft", () => {
  const item = newCohortException("code-150", "name-488");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortException moves to active", () => {
  const item = newCohortException("code-150", "name-488");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("CohortException rejects moves from closed", () => {
  const item = newCohortException("code-150", "name-488");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
