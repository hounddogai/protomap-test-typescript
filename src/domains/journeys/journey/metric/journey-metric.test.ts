import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyMetric } from "./journey-metric.js";

test("JourneyMetric starts in planned", () => {
  const item = newJourneyMetric("code-166", "name-151");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyMetric moves to in progress", () => {
  const item = newJourneyMetric("code-166", "name-151");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("JourneyMetric rejects moves from cancelled", () => {
  const item = newJourneyMetric("code-166", "name-151");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
