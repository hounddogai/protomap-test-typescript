import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveRedemptionSummary } from "./adaptive-redemption-summary.js";

test("AdaptiveRedemptionSummary starts in open", () => {
  const item = newAdaptiveRedemptionSummary("code-624", "title-237");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveRedemptionSummary moves to reopened", () => {
  const item = newAdaptiveRedemptionSummary("code-624", "title-237");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("AdaptiveRedemptionSummary rejects moves from archived", () => {
  const item = newAdaptiveRedemptionSummary("code-624", "title-237");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
