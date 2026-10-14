import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightForecast } from "./insight-forecast.js";

test("InsightForecast starts in planned", () => {
  const item = newInsightForecast("code-843", "name-429");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightForecast moves to scheduled", () => {
  const item = newInsightForecast("code-843", "name-429");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("InsightForecast rejects moves from cancelled", () => {
  const item = newInsightForecast("code-843", "name-429");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
