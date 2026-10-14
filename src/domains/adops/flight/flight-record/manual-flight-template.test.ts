import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualFlightTemplate } from "./manual-flight-template.js";

test("ManualFlightTemplate starts in planned", () => {
  const item = newManualFlightTemplate("code-152", "title-741");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualFlightTemplate moves to cancelled", () => {
  const item = newManualFlightTemplate("code-152", "title-741");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("ManualFlightTemplate rejects moves from cancelled", () => {
  const item = newManualFlightTemplate("code-152", "title-741");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
