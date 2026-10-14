import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingSuppressionForecast } from "./rolling-suppression-forecast.js";

test("RollingSuppressionForecast starts in proposed", () => {
  const item = newRollingSuppressionForecast("code-770", "label-83");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingSuppressionForecast moves to approved", () => {
  const item = newRollingSuppressionForecast("code-770", "label-83");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RollingSuppressionForecast rejects moves from withdrawn", () => {
  const item = newRollingSuppressionForecast("code-770", "label-83");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
