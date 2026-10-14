import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyBounceForecast } from "./legacy-bounce-forecast.js";

test("LegacyBounceForecast starts in open", () => {
  const item = newLegacyBounceForecast("code-507", "name-525");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyBounceForecast moves to resolved", () => {
  const item = newLegacyBounceForecast("code-507", "name-525");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("LegacyBounceForecast rejects moves from archived", () => {
  const item = newLegacyBounceForecast("code-507", "name-525");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
