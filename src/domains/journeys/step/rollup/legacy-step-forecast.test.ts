import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyStepForecast } from "./legacy-step-forecast.js";

test("LegacyStepForecast starts in new", () => {
  const item = newLegacyStepForecast("code-655", "name-289");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyStepForecast moves to running", () => {
  const item = newLegacyStepForecast("code-655", "name-289");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LegacyStepForecast rejects moves from failed", () => {
  const item = newLegacyStepForecast("code-655", "name-289");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
