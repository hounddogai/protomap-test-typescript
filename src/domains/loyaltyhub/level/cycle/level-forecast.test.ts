import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelForecast } from "./level-forecast.js";

test("LevelForecast starts in planned", () => {
  const item = newLevelForecast("code-624", "label-63");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelForecast moves to cancelled", () => {
  const item = newLevelForecast("code-624", "label-63");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("LevelForecast rejects moves from cancelled", () => {
  const item = newLevelForecast("code-624", "label-63");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
