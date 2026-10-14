import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedBadgeForecast } from "./capped-badge-forecast.js";

test("CappedBadgeForecast starts in idle", () => {
  const item = newCappedBadgeForecast("code-245", "title-296");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedBadgeForecast moves to warming", () => {
  const item = newCappedBadgeForecast("code-245", "title-296");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CappedBadgeForecast rejects moves from stopped", () => {
  const item = newCappedBadgeForecast("code-245", "title-296");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
