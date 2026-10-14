import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedInsightMetric } from "./capped-insight-metric.js";

test("CappedInsightMetric starts in proposed", () => {
  const item = newCappedInsightMetric("code-187", "label-856");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedInsightMetric moves to approved", () => {
  const item = newCappedInsightMetric("code-187", "label-856");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CappedInsightMetric rejects moves from withdrawn", () => {
  const item = newCappedInsightMetric("code-187", "label-856");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
