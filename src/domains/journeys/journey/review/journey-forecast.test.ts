import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyForecast } from "./journey-forecast.js";

test("JourneyForecast starts in idle", () => {
  const item = newJourneyForecast("code-700", "title-426");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyForecast moves to ready", () => {
  const item = newJourneyForecast("code-700", "title-426");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("JourneyForecast rejects moves from stopped", () => {
  const item = newJourneyForecast("code-700", "title-426");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
