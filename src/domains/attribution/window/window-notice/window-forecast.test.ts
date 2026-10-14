import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowForecast } from "./window-forecast.js";

test("WindowForecast starts in planned", () => {
  const item = newWindowForecast("code-443", "title-246");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowForecast moves to in progress", () => {
  const item = newWindowForecast("code-443", "title-246");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("WindowForecast rejects moves from cancelled", () => {
  const item = newWindowForecast("code-443", "title-246");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
