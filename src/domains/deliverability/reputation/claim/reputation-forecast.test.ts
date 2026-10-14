import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationForecast } from "./reputation-forecast.js";

test("ReputationForecast starts in planned", () => {
  const item = newReputationForecast("code-452", "title-394");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationForecast moves to in progress", () => {
  const item = newReputationForecast("code-452", "title-394");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ReputationForecast rejects moves from cancelled", () => {
  const item = newReputationForecast("code-452", "title-394");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
