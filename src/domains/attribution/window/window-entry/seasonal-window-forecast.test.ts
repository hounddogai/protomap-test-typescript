import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalWindowForecast } from "./seasonal-window-forecast.js";

test("SeasonalWindowForecast starts in draft", () => {
  const item = newSeasonalWindowForecast("code-259", "name-580");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalWindowForecast moves to suspended", () => {
  const item = newSeasonalWindowForecast("code-259", "name-580");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("SeasonalWindowForecast rejects moves from closed", () => {
  const item = newSeasonalWindowForecast("code-259", "name-580");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
