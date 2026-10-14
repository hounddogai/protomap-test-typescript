import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalBidRuleForecast } from "./seasonal-bid-rule-forecast.js";

test("SeasonalBidRuleForecast starts in draft", () => {
  const item = newSeasonalBidRuleForecast("code-380", "name-421");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalBidRuleForecast moves to active", () => {
  const item = newSeasonalBidRuleForecast("code-380", "name-421");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("SeasonalBidRuleForecast rejects moves from closed", () => {
  const item = newSeasonalBidRuleForecast("code-380", "name-421");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
