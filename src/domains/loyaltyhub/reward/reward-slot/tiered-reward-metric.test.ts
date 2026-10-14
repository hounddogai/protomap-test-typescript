import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRewardMetric } from "./tiered-reward-metric.js";

test("TieredRewardMetric starts in requested", () => {
  const item = newTieredRewardMetric("code-382", "label-716");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRewardMetric moves to expired", () => {
  const item = newTieredRewardMetric("code-382", "label-716");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("TieredRewardMetric rejects moves from expired", () => {
  const item = newTieredRewardMetric("code-382", "label-716");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
