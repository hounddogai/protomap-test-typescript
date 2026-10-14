import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBadgeForecast } from "./manual-badge-forecast.js";

test("ManualBadgeForecast starts in new", () => {
  const item = newManualBadgeForecast("code-92", "title-948");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBadgeForecast moves to failed", () => {
  const item = newManualBadgeForecast("code-92", "title-948");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("ManualBadgeForecast rejects moves from failed", () => {
  const item = newManualBadgeForecast("code-92", "title-948");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
