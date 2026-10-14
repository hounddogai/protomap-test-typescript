import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveLevelForecast } from "./adaptive-level-forecast.js";

test("AdaptiveLevelForecast starts in draft", () => {
  const item = newAdaptiveLevelForecast("code-178", "name-9");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveLevelForecast moves to pending", () => {
  const item = newAdaptiveLevelForecast("code-178", "name-9");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("AdaptiveLevelForecast rejects moves from closed", () => {
  const item = newAdaptiveLevelForecast("code-178", "name-9");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
