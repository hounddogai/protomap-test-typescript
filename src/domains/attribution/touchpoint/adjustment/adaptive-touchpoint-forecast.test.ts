import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveTouchpointForecast } from "./adaptive-touchpoint-forecast.js";

test("AdaptiveTouchpointForecast starts in new", () => {
  const item = newAdaptiveTouchpointForecast("code-492", "name-886");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveTouchpointForecast moves to queued", () => {
  const item = newAdaptiveTouchpointForecast("code-492", "name-886");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("AdaptiveTouchpointForecast rejects moves from failed", () => {
  const item = newAdaptiveTouchpointForecast("code-492", "name-886");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
