import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalRewardForecast } from "./seasonal-reward-forecast.js";

test("SeasonalRewardForecast starts in draft", () => {
  const item = newSeasonalRewardForecast("code-643", "label-151");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalRewardForecast moves to suspended", () => {
  const item = newSeasonalRewardForecast("code-643", "label-151");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("SeasonalRewardForecast rejects moves from closed", () => {
  const item = newSeasonalRewardForecast("code-643", "label-151");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
