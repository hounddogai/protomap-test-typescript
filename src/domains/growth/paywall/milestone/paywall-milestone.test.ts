import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallMilestone } from "./paywall-milestone.js";

test("PaywallMilestone starts in planned", () => {
  const item = newPaywallMilestone("code-939", "title-718");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallMilestone moves to completed", () => {
  const item = newPaywallMilestone("code-939", "title-718");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PaywallMilestone rejects moves from cancelled", () => {
  const item = newPaywallMilestone("code-939", "title-718");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
