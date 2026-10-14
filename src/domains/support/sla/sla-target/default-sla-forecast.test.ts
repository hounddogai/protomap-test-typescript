import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultSlaForecast } from "./default-sla-forecast.js";

test("DefaultSlaForecast starts in idle", () => {
  const item = newDefaultSlaForecast("code-501", "label-383");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultSlaForecast moves to warming", () => {
  const item = newDefaultSlaForecast("code-501", "label-383");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("DefaultSlaForecast rejects moves from stopped", () => {
  const item = newDefaultSlaForecast("code-501", "label-383");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
