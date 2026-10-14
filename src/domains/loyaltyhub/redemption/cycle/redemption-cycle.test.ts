import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionCycle } from "./redemption-cycle.js";

test("RedemptionCycle starts in planned", () => {
  const item = newRedemptionCycle("code-153", "name-315");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionCycle moves to cancelled", () => {
  const item = newRedemptionCycle("code-153", "name-315");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("RedemptionCycle rejects moves from cancelled", () => {
  const item = newRedemptionCycle("code-153", "name-315");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
