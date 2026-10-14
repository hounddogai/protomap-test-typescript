import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDoubleOptInForecast } from "./legacy-double-opt-in-forecast.js";

test("LegacyDoubleOptInForecast starts in idle", () => {
  const item = newLegacyDoubleOptInForecast("code-626", "title-636");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDoubleOptInForecast moves to draining", () => {
  const item = newLegacyDoubleOptInForecast("code-626", "title-636");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LegacyDoubleOptInForecast rejects moves from stopped", () => {
  const item = newLegacyDoubleOptInForecast("code-626", "title-636");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
