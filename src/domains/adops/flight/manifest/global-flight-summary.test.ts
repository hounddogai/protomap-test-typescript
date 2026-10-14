import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalFlightSummary } from "./global-flight-summary.js";

test("GlobalFlightSummary starts in planned", () => {
  const item = newGlobalFlightSummary("code-174", "label-657");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalFlightSummary moves to completed", () => {
  const item = newGlobalFlightSummary("code-174", "label-657");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("GlobalFlightSummary rejects moves from cancelled", () => {
  const item = newGlobalFlightSummary("code-174", "label-657");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
