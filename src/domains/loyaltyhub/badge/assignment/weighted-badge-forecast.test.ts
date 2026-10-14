import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedBadgeForecast } from "./weighted-badge-forecast.js";

test("WeightedBadgeForecast starts in open", () => {
  const item = newWeightedBadgeForecast("code-217", "label-806");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedBadgeForecast moves to in review", () => {
  const item = newWeightedBadgeForecast("code-217", "label-806");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WeightedBadgeForecast rejects moves from archived", () => {
  const item = newWeightedBadgeForecast("code-217", "label-806");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
