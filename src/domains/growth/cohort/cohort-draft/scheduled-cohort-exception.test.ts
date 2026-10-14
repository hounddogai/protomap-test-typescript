import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledCohortException } from "./scheduled-cohort-exception.js";

test("ScheduledCohortException starts in proposed", () => {
  const item = newScheduledCohortException("code-182", "name-742");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledCohortException moves to rejected", () => {
  const item = newScheduledCohortException("code-182", "name-742");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ScheduledCohortException rejects moves from withdrawn", () => {
  const item = newScheduledCohortException("code-182", "name-742");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
