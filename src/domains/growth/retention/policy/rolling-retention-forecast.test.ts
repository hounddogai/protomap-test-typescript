import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingRetentionForecast } from "./rolling-retention-forecast.js";

test("RollingRetentionForecast starts in requested", () => {
  const item = newRollingRetentionForecast("code-786", "label-602");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingRetentionForecast moves to expired", () => {
  const item = newRollingRetentionForecast("code-786", "label-602");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("RollingRetentionForecast rejects moves from expired", () => {
  const item = newRollingRetentionForecast("code-786", "label-602");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
