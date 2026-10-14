import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyInsightForecast } from "./legacy-insight-forecast.js";

test("LegacyInsightForecast starts in draft", () => {
  const item = newLegacyInsightForecast("code-895", "label-129");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyInsightForecast moves to closed", () => {
  const item = newLegacyInsightForecast("code-895", "label-129");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("LegacyInsightForecast rejects moves from closed", () => {
  const item = newLegacyInsightForecast("code-895", "label-129");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
