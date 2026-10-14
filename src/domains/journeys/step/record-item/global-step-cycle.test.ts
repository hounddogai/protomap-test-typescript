import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalStepCycle } from "./global-step-cycle.js";

test("GlobalStepCycle starts in open", () => {
  const item = newGlobalStepCycle("code-865", "label-207");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalStepCycle moves to in review", () => {
  const item = newGlobalStepCycle("code-865", "label-207");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("GlobalStepCycle rejects moves from archived", () => {
  const item = newGlobalStepCycle("code-865", "label-207");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
