import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeForecast } from "./nudge-forecast.js";

test("NudgeForecast starts in new", () => {
  const item = newNudgeForecast("code-648", "name-515");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeForecast moves to running", () => {
  const item = newNudgeForecast("code-648", "name-515");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("NudgeForecast rejects moves from failed", () => {
  const item = newNudgeForecast("code-648", "name-515");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
