import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionMilestone } from "./suppression-milestone.js";

test("SuppressionMilestone starts in planned", () => {
  const item = newSuppressionMilestone("code-722", "label-412");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionMilestone moves to cancelled", () => {
  const item = newSuppressionMilestone("code-722", "label-412");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("SuppressionMilestone rejects moves from cancelled", () => {
  const item = newSuppressionMilestone("code-722", "label-412");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
