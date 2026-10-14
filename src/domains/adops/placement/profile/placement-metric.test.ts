import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementMetric } from "./placement-metric.js";

test("PlacementMetric starts in created", () => {
  const item = newPlacementMetric("code-220", "name-840");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementMetric moves to retired", () => {
  const item = newPlacementMetric("code-220", "name-840");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PlacementMetric rejects moves from retired", () => {
  const item = newPlacementMetric("code-220", "name-840");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
