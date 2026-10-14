import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualFlightPlan } from "./manual-flight-plan.js";

test("ManualFlightPlan starts in planned", () => {
  const item = newManualFlightPlan("code-501", "name-955");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualFlightPlan moves to scheduled", () => {
  const item = newManualFlightPlan("code-501", "name-955");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ManualFlightPlan rejects moves from cancelled", () => {
  const item = newManualFlightPlan("code-501", "name-955");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
