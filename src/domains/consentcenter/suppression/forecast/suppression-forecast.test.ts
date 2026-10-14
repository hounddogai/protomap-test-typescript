import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionForecast } from "./suppression-forecast.js";

test("SuppressionForecast starts in created", () => {
  const item = newSuppressionForecast("code-991", "title-14");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionForecast moves to validated", () => {
  const item = newSuppressionForecast("code-991", "title-14");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SuppressionForecast rejects moves from retired", () => {
  const item = newSuppressionForecast("code-991", "title-14");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
