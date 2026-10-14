import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationForecast } from "./escalation-forecast.js";

test("EscalationForecast starts in planned", () => {
  const item = newEscalationForecast("code-478", "label-593");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationForecast moves to completed", () => {
  const item = newEscalationForecast("code-478", "label-593");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("EscalationForecast rejects moves from cancelled", () => {
  const item = newEscalationForecast("code-478", "label-593");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
