import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathForecast } from "./path-forecast.js";

test("PathForecast starts in new", () => {
  const item = newPathForecast("code-568", "name-146");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathForecast moves to running", () => {
  const item = newPathForecast("code-568", "name-146");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PathForecast rejects moves from failed", () => {
  const item = newPathForecast("code-568", "name-146");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
