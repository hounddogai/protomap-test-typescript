import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalCohortSummary } from "./seasonal-cohort-summary.js";

test("SeasonalCohortSummary starts in idle", () => {
  const item = newSeasonalCohortSummary("code-39", "title-10");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalCohortSummary moves to draining", () => {
  const item = newSeasonalCohortSummary("code-39", "title-10");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("SeasonalCohortSummary rejects moves from stopped", () => {
  const item = newSeasonalCohortSummary("code-39", "title-10");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
