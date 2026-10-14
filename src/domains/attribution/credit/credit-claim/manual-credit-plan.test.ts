import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualCreditPlan } from "./manual-credit-plan.js";

test("ManualCreditPlan starts in requested", () => {
  const item = newManualCreditPlan("code-365", "label-354");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualCreditPlan moves to granted", () => {
  const item = newManualCreditPlan("code-365", "label-354");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ManualCreditPlan rejects moves from expired", () => {
  const item = newManualCreditPlan("code-365", "label-354");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
