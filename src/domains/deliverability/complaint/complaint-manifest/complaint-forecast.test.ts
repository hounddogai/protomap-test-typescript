import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintForecast } from "./complaint-forecast.js";

test("ComplaintForecast starts in idle", () => {
  const item = newComplaintForecast("code-810", "label-957");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintForecast moves to warming", () => {
  const item = newComplaintForecast("code-810", "label-957");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ComplaintForecast rejects moves from stopped", () => {
  const item = newComplaintForecast("code-810", "label-957");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
