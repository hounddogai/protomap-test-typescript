import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingInsightMetric } from "./pending-insight-metric.js";

test("PendingInsightMetric starts in created", () => {
  const item = newPendingInsightMetric("code-795", "name-196");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingInsightMetric moves to published", () => {
  const item = newPendingInsightMetric("code-795", "name-196");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PendingInsightMetric rejects moves from retired", () => {
  const item = newPendingInsightMetric("code-795", "name-196");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
