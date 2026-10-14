import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalEscalationEstimate } from "./regional-escalation-estimate.js";

test("RegionalEscalationEstimate starts in planned", () => {
  const item = newRegionalEscalationEstimate("code-401", "name-515");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalEscalationEstimate moves to in progress", () => {
  const item = newRegionalEscalationEstimate("code-401", "name-515");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RegionalEscalationEstimate rejects moves from cancelled", () => {
  const item = newRegionalEscalationEstimate("code-401", "name-515");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
