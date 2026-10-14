import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedRewardForecast } from "./weighted-reward-forecast.js";

test("WeightedRewardForecast starts in proposed", () => {
  const item = newWeightedRewardForecast("code-922", "label-427");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedRewardForecast moves to approved", () => {
  const item = newWeightedRewardForecast("code-922", "label-427");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedRewardForecast rejects moves from withdrawn", () => {
  const item = newWeightedRewardForecast("code-922", "label-427");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
