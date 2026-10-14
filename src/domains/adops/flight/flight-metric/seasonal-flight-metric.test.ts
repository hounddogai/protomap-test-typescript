import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalFlightMetric } from "./seasonal-flight-metric.js";

test("SeasonalFlightMetric starts in open", () => {
  const item = newSeasonalFlightMetric("code-99", "title-225");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalFlightMetric moves to in review", () => {
  const item = newSeasonalFlightMetric("code-99", "title-225");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SeasonalFlightMetric rejects moves from archived", () => {
  const item = newSeasonalFlightMetric("code-99", "title-225");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
