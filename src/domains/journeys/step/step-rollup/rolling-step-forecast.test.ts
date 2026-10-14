import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingStepForecast } from "./rolling-step-forecast.js";

test("RollingStepForecast starts in open", () => {
  const item = newRollingStepForecast("code-955", "label-169");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingStepForecast moves to resolved", () => {
  const item = newRollingStepForecast("code-955", "label-169");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RollingStepForecast rejects moves from archived", () => {
  const item = newRollingStepForecast("code-955", "label-169");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
