import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightPlan } from "./flight-plan.js";

test("FlightPlan starts in open", () => {
  const item = newFlightPlan("code-365", "title-273");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightPlan moves to in review", () => {
  const item = newFlightPlan("code-365", "title-273");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FlightPlan rejects moves from archived", () => {
  const item = newFlightPlan("code-365", "title-273");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
