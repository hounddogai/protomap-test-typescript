import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryBadgeForecast } from "./primary-badge-forecast.js";

test("PrimaryBadgeForecast starts in idle", () => {
  const item = newPrimaryBadgeForecast("code-571", "title-733");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryBadgeForecast moves to warming", () => {
  const item = newPrimaryBadgeForecast("code-571", "title-733");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PrimaryBadgeForecast rejects moves from stopped", () => {
  const item = newPrimaryBadgeForecast("code-571", "title-733");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
