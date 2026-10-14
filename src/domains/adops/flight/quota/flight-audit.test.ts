import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightAudit } from "./flight-audit.js";

test("FlightAudit starts in planned", () => {
  const item = newFlightAudit("code-85", "label-295");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightAudit moves to scheduled", () => {
  const item = newFlightAudit("code-85", "label-295");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("FlightAudit rejects moves from cancelled", () => {
  const item = newFlightAudit("code-85", "label-295");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
