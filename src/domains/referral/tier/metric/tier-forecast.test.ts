import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierForecast } from "./tier-forecast.js";

test("TierForecast starts in idle", () => {
  const item = newTierForecast("code-246", "label-909");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierForecast moves to ready", () => {
  const item = newTierForecast("code-246", "label-909");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("TierForecast rejects moves from stopped", () => {
  const item = newTierForecast("code-246", "label-909");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
