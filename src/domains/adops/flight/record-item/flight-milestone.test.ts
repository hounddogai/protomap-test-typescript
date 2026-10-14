import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightMilestone } from "./flight-milestone.js";

test("FlightMilestone starts in proposed", () => {
  const item = newFlightMilestone("code-129", "title-159");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightMilestone moves to withdrawn", () => {
  const item = newFlightMilestone("code-129", "title-159");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("FlightMilestone rejects moves from withdrawn", () => {
  const item = newFlightMilestone("code-129", "title-159");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
