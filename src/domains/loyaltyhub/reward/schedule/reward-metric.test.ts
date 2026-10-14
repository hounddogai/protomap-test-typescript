import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardMetric } from "./reward-metric.js";

test("RewardMetric starts in created", () => {
  const item = newRewardMetric("code-832", "title-935");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardMetric moves to validated", () => {
  const item = newRewardMetric("code-832", "title-935");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RewardMetric rejects moves from retired", () => {
  const item = newRewardMetric("code-832", "title-935");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
