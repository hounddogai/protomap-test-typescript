import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalSubscriptionMetric } from "./seasonal-subscription-metric.js";

test("SeasonalSubscriptionMetric starts in proposed", () => {
  const item = newSeasonalSubscriptionMetric("code-704", "name-206");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalSubscriptionMetric moves to rejected", () => {
  const item = newSeasonalSubscriptionMetric("code-704", "name-206");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("SeasonalSubscriptionMetric rejects moves from withdrawn", () => {
  const item = newSeasonalSubscriptionMetric("code-704", "name-206");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
