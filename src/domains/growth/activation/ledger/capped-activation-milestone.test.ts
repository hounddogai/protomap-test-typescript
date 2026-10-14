import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedActivationMilestone } from "./capped-activation-milestone.js";

test("CappedActivationMilestone starts in proposed", () => {
  const item = newCappedActivationMilestone("code-401", "label-3");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedActivationMilestone moves to approved", () => {
  const item = newCappedActivationMilestone("code-401", "label-3");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CappedActivationMilestone rejects moves from withdrawn", () => {
  const item = newCappedActivationMilestone("code-401", "label-3");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
