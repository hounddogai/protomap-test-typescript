import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointForecast } from "./touchpoint-forecast.js";

test("TouchpointForecast starts in new", () => {
  const item = newTouchpointForecast("code-147", "title-64");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointForecast moves to running", () => {
  const item = newTouchpointForecast("code-147", "title-64");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("TouchpointForecast rejects moves from failed", () => {
  const item = newTouchpointForecast("code-147", "title-64");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
