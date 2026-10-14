import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredCohortSummary } from "./tiered-cohort-summary.js";

test("TieredCohortSummary starts in idle", () => {
  const item = newTieredCohortSummary("code-276", "title-463");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredCohortSummary moves to stopped", () => {
  const item = newTieredCohortSummary("code-276", "title-463");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("TieredCohortSummary rejects moves from stopped", () => {
  const item = newTieredCohortSummary("code-276", "title-463");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
