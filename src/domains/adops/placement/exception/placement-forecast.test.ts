import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementForecast } from "./placement-forecast.js";

test("PlacementForecast starts in open", () => {
  const item = newPlacementForecast("code-22", "title-254");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementForecast moves to resolved", () => {
  const item = newPlacementForecast("code-22", "title-254");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("PlacementForecast rejects moves from archived", () => {
  const item = newPlacementForecast("code-22", "title-254");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
