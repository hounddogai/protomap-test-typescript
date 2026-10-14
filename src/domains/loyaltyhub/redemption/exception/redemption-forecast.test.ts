import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionForecast } from "./redemption-forecast.js";

test("RedemptionForecast starts in open", () => {
  const item = newRedemptionForecast("code-885", "name-745");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionForecast moves to in review", () => {
  const item = newRedemptionForecast("code-885", "name-745");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RedemptionForecast rejects moves from archived", () => {
  const item = newRedemptionForecast("code-885", "name-745");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
