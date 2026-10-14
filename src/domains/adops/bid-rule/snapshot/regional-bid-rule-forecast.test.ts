import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalBidRuleForecast } from "./regional-bid-rule-forecast.js";

test("RegionalBidRuleForecast starts in open", () => {
  const item = newRegionalBidRuleForecast("code-640", "label-300");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalBidRuleForecast moves to in review", () => {
  const item = newRegionalBidRuleForecast("code-640", "label-300");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RegionalBidRuleForecast rejects moves from archived", () => {
  const item = newRegionalBidRuleForecast("code-640", "label-300");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
