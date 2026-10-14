import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackStreakForecast } from "./fallback-streak-forecast.js";

test("FallbackStreakForecast starts in open", () => {
  const item = newFallbackStreakForecast("code-397", "title-438");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackStreakForecast moves to reopened", () => {
  const item = newFallbackStreakForecast("code-397", "title-438");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("FallbackStreakForecast rejects moves from archived", () => {
  const item = newFallbackStreakForecast("code-397", "title-438");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
