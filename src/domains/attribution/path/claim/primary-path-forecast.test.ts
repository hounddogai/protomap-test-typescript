import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPathForecast } from "./primary-path-forecast.js";

test("PrimaryPathForecast starts in planned", () => {
  const item = newPrimaryPathForecast("code-725", "title-431");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPathForecast moves to scheduled", () => {
  const item = newPrimaryPathForecast("code-725", "title-431");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PrimaryPathForecast rejects moves from cancelled", () => {
  const item = newPrimaryPathForecast("code-725", "title-431");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
