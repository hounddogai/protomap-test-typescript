import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPlacementForecast } from "./strict-placement-forecast.js";

test("StrictPlacementForecast starts in created", () => {
  const item = newStrictPlacementForecast("code-409", "title-608");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPlacementForecast moves to validated", () => {
  const item = newStrictPlacementForecast("code-409", "title-608");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("StrictPlacementForecast rejects moves from retired", () => {
  const item = newStrictPlacementForecast("code-409", "title-608");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
