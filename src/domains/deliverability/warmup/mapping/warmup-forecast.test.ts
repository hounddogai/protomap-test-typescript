import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupForecast } from "./warmup-forecast.js";

test("WarmupForecast starts in planned", () => {
  const item = newWarmupForecast("code-599", "label-588");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupForecast moves to in progress", () => {
  const item = newWarmupForecast("code-599", "label-588");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("WarmupForecast rejects moves from cancelled", () => {
  const item = newWarmupForecast("code-599", "label-588");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
