import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightSummary } from "./insight-summary.js";

test("InsightSummary starts in open", () => {
  const item = newInsightSummary("code-121", "label-195");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightSummary moves to in review", () => {
  const item = newInsightSummary("code-121", "label-195");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("InsightSummary rejects moves from archived", () => {
  const item = newInsightSummary("code-121", "label-195");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
