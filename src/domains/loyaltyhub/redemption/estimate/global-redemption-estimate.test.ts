import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRedemptionEstimate } from "./global-redemption-estimate.js";

test("GlobalRedemptionEstimate starts in planned", () => {
  const item = newGlobalRedemptionEstimate("code-926", "name-123");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRedemptionEstimate moves to completed", () => {
  const item = newGlobalRedemptionEstimate("code-926", "name-123");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("GlobalRedemptionEstimate rejects moves from cancelled", () => {
  const item = newGlobalRedemptionEstimate("code-926", "name-123");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
