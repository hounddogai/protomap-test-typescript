import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPacingPlan } from "./primary-pacing-plan.js";

test("PrimaryPacingPlan starts in draft", () => {
  const item = newPrimaryPacingPlan("code-701", "title-432");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPacingPlan moves to closed", () => {
  const item = newPrimaryPacingPlan("code-701", "title-432");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("PrimaryPacingPlan rejects moves from closed", () => {
  const item = newPrimaryPacingPlan("code-701", "title-432");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
