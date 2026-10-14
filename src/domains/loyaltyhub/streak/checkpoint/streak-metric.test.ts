import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakMetric } from "./streak-metric.js";

test("StreakMetric starts in created", () => {
  const item = newStreakMetric("code-801", "label-852");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakMetric moves to retired", () => {
  const item = newStreakMetric("code-801", "label-852");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("StreakMetric rejects moves from retired", () => {
  const item = newStreakMetric("code-801", "label-852");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
