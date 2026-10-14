import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckForecast } from "./fraud-check-forecast.js";

test("FraudCheckForecast starts in proposed", () => {
  const item = newFraudCheckForecast("code-561", "name-618");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckForecast moves to rejected", () => {
  const item = newFraudCheckForecast("code-561", "name-618");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FraudCheckForecast rejects moves from withdrawn", () => {
  const item = newFraudCheckForecast("code-561", "name-618");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
