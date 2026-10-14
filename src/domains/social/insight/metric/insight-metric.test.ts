import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightMetric } from "./insight-metric.js";

test("InsightMetric starts in open", () => {
  const item = newInsightMetric("code-436", "name-202");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightMetric moves to in review", () => {
  const item = newInsightMetric("code-436", "name-202");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("InsightMetric rejects moves from archived", () => {
  const item = newInsightMetric("code-436", "name-202");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
