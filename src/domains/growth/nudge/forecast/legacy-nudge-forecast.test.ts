import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyNudgeForecast } from "./legacy-nudge-forecast.js";

test("LegacyNudgeForecast starts in requested", () => {
  const item = newLegacyNudgeForecast("code-581", "label-166");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyNudgeForecast moves to granted", () => {
  const item = newLegacyNudgeForecast("code-581", "label-166");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LegacyNudgeForecast rejects moves from expired", () => {
  const item = newLegacyNudgeForecast("code-581", "label-166");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
