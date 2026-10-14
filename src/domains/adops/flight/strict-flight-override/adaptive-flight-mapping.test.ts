import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveFlightMapping } from "./adaptive-flight-mapping.js";

test("AdaptiveFlightMapping starts in planned", () => {
  const item = newAdaptiveFlightMapping("code-291", "name-967");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveFlightMapping moves to completed", () => {
  const item = newAdaptiveFlightMapping("code-291", "name-967");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("AdaptiveFlightMapping rejects moves from cancelled", () => {
  const item = newAdaptiveFlightMapping("code-291", "name-967");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
