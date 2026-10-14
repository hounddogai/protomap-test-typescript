import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelForecast } from "./model-forecast.js";

test("ModelForecast starts in planned", () => {
  const item = newModelForecast("code-793", "name-852");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelForecast moves to completed", () => {
  const item = newModelForecast("code-793", "name-852");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("ModelForecast rejects moves from cancelled", () => {
  const item = newModelForecast("code-793", "name-852");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
