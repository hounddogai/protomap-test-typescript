import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledBidRuleForecast } from "./scheduled-bid-rule-forecast.js";

test("ScheduledBidRuleForecast starts in planned", () => {
  const item = newScheduledBidRuleForecast("code-901", "title-798");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledBidRuleForecast moves to scheduled", () => {
  const item = newScheduledBidRuleForecast("code-901", "title-798");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ScheduledBidRuleForecast rejects moves from cancelled", () => {
  const item = newScheduledBidRuleForecast("code-901", "title-798");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
