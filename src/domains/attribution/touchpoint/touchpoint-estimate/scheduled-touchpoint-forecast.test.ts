import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledTouchpointForecast } from "./scheduled-touchpoint-forecast.js";

test("ScheduledTouchpointForecast starts in open", () => {
  const item = newScheduledTouchpointForecast("code-353", "label-527");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledTouchpointForecast moves to resolved", () => {
  const item = newScheduledTouchpointForecast("code-353", "label-527");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ScheduledTouchpointForecast rejects moves from archived", () => {
  const item = newScheduledTouchpointForecast("code-353", "label-527");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
