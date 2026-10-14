import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortMetric } from "./cohort-metric.js";

test("CohortMetric starts in open", () => {
  const item = newCohortMetric("code-510", "title-862");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortMetric moves to resolved", () => {
  const item = newCohortMetric("code-510", "title-862");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CohortMetric rejects moves from archived", () => {
  const item = newCohortMetric("code-510", "title-862");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
