import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryStepForecast } from "./primary-step-forecast.js";

test("PrimaryStepForecast starts in idle", () => {
  const item = newPrimaryStepForecast("code-823", "name-536");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryStepForecast moves to warming", () => {
  const item = newPrimaryStepForecast("code-823", "name-536");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PrimaryStepForecast rejects moves from stopped", () => {
  const item = newPrimaryStepForecast("code-823", "name-536");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
