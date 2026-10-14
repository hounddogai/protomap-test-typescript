import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPacingForecast } from "./lenient-pacing-forecast.js";

test("LenientPacingForecast starts in planned", () => {
  const item = newLenientPacingForecast("code-659", "name-804");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPacingForecast moves to scheduled", () => {
  const item = newLenientPacingForecast("code-659", "name-804");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientPacingForecast rejects moves from cancelled", () => {
  const item = newLenientPacingForecast("code-659", "name-804");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
