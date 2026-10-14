import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakForecast } from "./streak-forecast.js";

test("StreakForecast starts in draft", () => {
  const item = newStreakForecast("code-247", "title-354");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakForecast moves to active", () => {
  const item = newStreakForecast("code-247", "title-354");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("StreakForecast rejects moves from closed", () => {
  const item = newStreakForecast("code-247", "title-354");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
