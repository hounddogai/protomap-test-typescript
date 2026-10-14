import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardForecast } from "./reward-forecast.js";

test("RewardForecast starts in planned", () => {
  const item = newRewardForecast("code-779", "title-807");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardForecast moves to in progress", () => {
  const item = newRewardForecast("code-779", "title-807");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RewardForecast rejects moves from cancelled", () => {
  const item = newRewardForecast("code-779", "title-807");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
